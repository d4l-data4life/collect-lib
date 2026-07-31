// Command xlang is the Go half of collect-lib's cross-language check for the v4 hybrid
// encryption format. It speaks JSON on stdin/stdout so the Node side (scripts/xlang.mjs)
// can drive both directions:
//
//	-mode=generate   encrypt a set of records with go-crypto, print them as JSON
//	-mode=verify     read collect-lib-encrypted records from stdin, decrypt them
//
// It depends only on the public github.com/d4l-data4life/go-crypto release.
package main

import (
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"flag"
	"fmt"
	"math/big"
	"os"
	"strings"

	"github.com/d4l-data4life/go-crypto/d4lcrypto"
	"github.com/ethereum/go-ethereum/crypto/secp256k1"
)

// recipient ids, mirroring collect-lib's V4_DECRYPTER_* constants.
const (
	decrypterMobileApp    = 0
	decrypterDataReceiver = 1
)

// vector is one record plus the material needed to open it.
type vector struct {
	Name         string `json:"name"`
	Plaintext    string `json:"plaintext"`
	Ciphertext   string `json:"ciphertext"`
	PhonePrivB64 string `json:"phonePrivB64,omitempty"`
	RecoveryB64  string `json:"recoveryB64,omitempty"`
	// Recipients that must be able to open the record, by name ("ec", "aes", "rsa").
	Recipients []string `json:"recipients"`
}

// payload is the JSON exchanged with the Node side in both directions.
type payload struct {
	Vectors        []vector `json:"vectors"`
	PhoneScalarB64 string   `json:"phoneScalarB64,omitempty"`
	PhonePubB64    string   `json:"phonePubB64,omitempty"`
	RecoveryB64    string   `json:"recoveryB64"`
	RSAPrivPEM     string   `json:"rsaPrivPEM"`
	RSAPubPEM      string   `json:"rsaPubPEM"`
}

func main() {
	mode := flag.String("mode", "", "generate | verify")
	flag.Parse()
	switch *mode {
	case "generate":
		generate()
	case "verify":
		verify()
	default:
		fmt.Fprintln(os.Stderr, "usage: xlang -mode=generate|verify")
		os.Exit(2)
	}
}

// ecKeyFromScalar rebuilds a secp256k1 keypair from a raw scalar.
func ecKeyFromScalar(scalar []byte) *ecdsa.PrivateKey {
	priv := new(ecdsa.PrivateKey)
	priv.Curve = secp256k1.S256()
	priv.D = new(big.Int).SetBytes(scalar)
	priv.X, priv.Y = secp256k1.S256().ScalarBaseMult(scalar)
	return priv
}

func randomBytes(n int) []byte {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return b
}

// generate encrypts one record per interesting slot combination and writes them to stdout.
func generate() {
	recovery := randomBytes(32)
	rsaKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		panic(err)
	}
	rsaPub := d4lcrypto.NewPublicKey(&rsaKey.PublicKey)

	// One phone keypair reused across vectors; the Node side decrypts with the scalar.
	scalar := randomBytes(32)
	phone := ecKeyFromScalar(scalar)
	phonePub := d4lcrypto.NewPublicKey(&phone.PublicKey)
	scalarB64 := base64.StdEncoding.EncodeToString(scalar)
	recoveryB64 := base64.StdEncoding.EncodeToString(recovery)

	out := payload{
		PhoneScalarB64: scalarB64,
		RecoveryB64:    recoveryB64,
		RSAPrivPEM:     pemEncode("PRIVATE KEY", mustMarshalPKCS8(rsaKey)),
		RSAPubPEM:      pemEncode("PUBLIC KEY", mustMarshalPKIX(&rsaKey.PublicKey)),
		// The phone's public key in the same SPKI form the app sends to the collector,
		// which is what collect-lib's v4EcSlot consumes.
		PhonePubB64: base64.StdEncoding.EncodeToString(spkiSecp256k1(&phone.PublicKey)),
	}

	add := func(name, plaintext string, recipients []string, slots ...d4lcrypto.SlotSpec) {
		ct, err := d4lcrypto.EncryptHybridV4([]byte(plaintext), slots...)
		if err != nil {
			panic(err)
		}
		out.Vectors = append(out.Vectors, vector{
			Name: name, Plaintext: plaintext,
			Ciphertext:   base64.StdEncoding.EncodeToString(ct),
			PhonePrivB64: scalarB64, RecoveryB64: recoveryB64,
			Recipients: recipients,
		})
	}

	ec := d4lcrypto.ECSlot(decrypterMobileApp, phonePub)
	aes := d4lcrypto.AESSlot(decrypterMobileApp, recovery)
	rsaSlot := d4lcrypto.RSASlot(decrypterDataReceiver, rsaPub)

	add("ec-only", `{"hello":"garmin","steps":1234}`, []string{"ec"}, ec)
	add("aes-recovery-only", `{"hello":"recovery"}`, []string{"aes"}, aes)
	add("rsa-only", `{"hello":"receiver"}`, []string{"rsa"}, rsaSlot)
	add("multi-slot", `{"multi":"recipient","steps":7}`, []string{"ec", "aes", "rsa"}, ec, aes, rsaSlot)
	add("utf8", `{"note":"Grüße 🌍 — ümlauts & emoji","spo2":97}`, []string{"ec"}, ec)
	add("empty-payload", "", []string{"ec"}, ec)
	// Large enough to cross the JS call-argument limit that a naive binary-string
	// conversion trips over (~128 KB).
	add("large", `{"dailies":[`+strings.Repeat(`{"t":1,"hr":72},`, 30000)+`{"t":0,"hr":60}]}`,
		[]string{"ec"}, ec)

	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", " ")
	if err := enc.Encode(out); err != nil {
		panic(err)
	}
	fmt.Fprintf(os.Stderr, "xlang: generated %d go-crypto records\n", len(out.Vectors))
}

// verify decrypts collect-lib-produced records, asserting that each listed recipient opens
// the record with its own key and that recipients absent from the record are refused.
func verify() {
	var in payload
	if err := json.NewDecoder(os.Stdin).Decode(&in); err != nil {
		panic(err)
	}

	block, _ := pem.Decode([]byte(in.RSAPrivPEM))
	if block == nil {
		panic("xlang: no PEM block in rsaPrivPEM")
	}
	parsed, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		panic(err)
	}
	rsaKey := parsed.(*rsa.PrivateKey)
	recovery := mustDecode(in.RecoveryB64)
	phone := ecKeyFromScalar(mustDecode(in.PhoneScalarB64))

	decrypters := map[string]*d4lcrypto.Decrypter{
		"ec":  d4lcrypto.NewDecrypterFromKeys(d4lcrypto.ECKey(decrypterMobileApp, d4lcrypto.NewPrivateKey(phone))),
		"aes": d4lcrypto.NewDecrypterWithRecoveryKey(d4lcrypto.NewPrivateKeys(), recovery),
		"rsa": d4lcrypto.NewDecrypter(d4lcrypto.NewPrivateKeys(rsaKey)),
	}

	checks, fails := 0, 0
	for _, v := range in.Vectors {
		ct := mustDecode(v.Ciphertext)
		expected := map[string]bool{}
		for _, r := range v.Recipients {
			expected[r] = true
		}
		for _, name := range []string{"ec", "aes", "rsa"} {
			checks++
			got, err := decrypters[name].Decrypt(ct)
			switch {
			case expected[name] && err != nil:
				fmt.Printf("FAIL  ts->go  %-18s via %-4s %v\n", v.Name, name, err)
				fails++
			case expected[name] && string(got) != v.Plaintext:
				fmt.Printf("FAIL  ts->go  %-18s via %-4s plaintext mismatch\n", v.Name, name)
				fails++
			case expected[name]:
				fmt.Printf("PASS  ts->go  %-18s via %-4s (%d B)\n", v.Name, name, len(got))
			case err == nil:
				fmt.Printf("FAIL  ts->go  %-18s via %-4s opened a slot addressed to someone else\n", v.Name, name)
				fails++
			default:
				fmt.Printf("ok    ts->go  %-18s via %-4s refused, as it should\n", v.Name, name)
			}
		}
	}
	fmt.Printf("\nts -> go: %d checks, %d failed\n", checks, fails)
	if fails > 0 {
		os.Exit(1)
	}
}

func mustDecode(b64 string) []byte {
	raw, err := base64.StdEncoding.DecodeString(b64)
	if err != nil {
		panic(err)
	}
	return raw
}

func mustMarshalPKCS8(key *rsa.PrivateKey) []byte {
	der, err := x509.MarshalPKCS8PrivateKey(key)
	if err != nil {
		panic(err)
	}
	return der
}

func mustMarshalPKIX(pub any) []byte {
	der, err := x509.MarshalPKIXPublicKey(pub)
	if err != nil {
		panic(err)
	}
	return der
}

// spkiSecp256k1 encodes a secp256k1 public key as SPKI DER. Go's x509 refuses this curve
// (and go-crypto's PublicKey.String() therefore yields ""), so the header is written
// literally — the same bytes the app produces in KeyHandler.extendPublicKey, and the ones
// go-crypto's PublicKey.Read parses back.
func spkiSecp256k1(pub *ecdsa.PublicKey) []byte {
	// SEQUENCE { SEQUENCE { OID ecPublicKey, OID secp256k1 }, BIT STRING { 0x04 ... } }
	header := []byte{
		0x30, 0x56, 0x30, 0x10, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x05,
		0x2b, 0x81, 0x04, 0x00, 0x0a, 0x03, 0x42, 0x00, 0x04,
	}
	out := make([]byte, 0, len(header)+64)
	out = append(out, header...)
	out = append(out, leftPad32(pub.X.Bytes())...)
	return append(out, leftPad32(pub.Y.Bytes())...)
}

// leftPad32 pads a big-endian coordinate to the fixed 32-byte width the encoding requires.
func leftPad32(b []byte) []byte {
	if len(b) >= 32 {
		return b[len(b)-32:]
	}
	padded := make([]byte, 32)
	copy(padded[32-len(b):], b)
	return padded
}

func pemEncode(blockType string, der []byte) string {
	return string(pem.EncodeToMemory(&pem.Block{Type: blockType, Bytes: der}))
}
