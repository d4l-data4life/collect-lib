import {
  HybridEncrypter,
  V4_DECRYPTER_DATA_RECEIVER,
  V4_DECRYPTER_MOBILE_APP,
  v4AesKey,
  v4AesSlot,
  v4EcKey,
  v4EcSlot,
  v4RsaKey,
  v4RsaSlot,
} from './hybridEncryption';
import { secp256k1 } from '@noble/curves/secp256k1';
import { WebConverter } from '..';
import * as forge from 'node-forge';
import {
  binaryStringToUint8Array,
  uint8ArrayToBinaryString,
  utf8ToUint8Array,
} from '../helper/converter';

const donorIdentity = {
  t: 'data-donation',
  keys: {
    priv: '1m2vGqozd9liGPxg4D8Cr9sjV4K2gpwayw90RfMhglc=',
    pub: 'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEars2EMxOJvgpavwGLc/6Xu4xgtOe5QjOcOHJWCLkEQylJDdOZume1tWmHfiNbZNGtqkLdZSjqc1J+EFpdOXSew==',
    rec: 'TjYtXohpnhir+vUlv8UsUFAE+MNdazJb1psp4UZ2mic=',
  },
  v: 2,
  scope: 'demo-bp',
};

const testKey =
  '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAo/RjFKPLbcahfXM/Nbnf\n91v3IR5l3roM7CAZXPdYt3PsCE4uTlumYOjQsRcCKbzk4GQCi4MDRszKai3bMQZK\nqmhJ8nRHq5d4Q0bvh+g5e9YDCvoqDI/C1KvXAfnKwxUM7QmIwJGAV3H7ZlYizX85\nExaIhNM67RMCBi5ntKNdM1GIEFYWRKFlU2ghZbGlEw9VBbjXDzZWuPWCrWUHK5tt\n6kcpdP8tyYV0L2mLXpM+2ZUPBETIufF5yEM41Iz6aPPh2FO26+zIuszmWtR9AxVo\nwjK87mgmL4Aqt+aEOGsGKq42RCoRE9SiPYGUtbXlKj9hpXTwZipqM5aQP0iku0i/\noQIDAQAB\n-----END PUBLIC KEY-----\n';

describe('HybridEncrypter', () => {
  const converter = new WebConverter();
  const encrypter = new HybridEncrypter(converter);

  it('should encrypt and decrypt a string correctly', () => {
    const originalString = 'Hello, World!';
    const encryptedData = encrypter.encrypt(donorIdentity.keys.rec, originalString, testKey);
    const decryptedString = encrypter.decrypt(donorIdentity.keys.rec, encryptedData);
    expect(decryptedString).toBe(originalString);
  });

  it('should encrypt and decrypt non-ASCII text correctly', () => {
    const originalString = 'Hello, world! äöü 🌍';
    const encryptedData = encrypter.encrypt(donorIdentity.keys.rec, originalString, testKey);
    const decryptedString = encrypter.decrypt(donorIdentity.keys.rec, encryptedData);
    expect(decryptedString).toBe(originalString);
  });
});

describe('HybridEncrypter v4 (ECIES secp256k1)', () => {
  const converter = new WebConverter();
  const encrypter = new HybridEncrypter(converter);

  // Canonical cross-language vector — produced by go-crypto's
  // d4lcrypto.TestHybridV4_DeterministicVector. If this test fails, the v4 wire format
  // has drifted between go-crypto (encode) and collect-lib (decode). The scalar is kept in
  // hex to match go-crypto's vectorScalarHex constant; the API takes it base64-encoded.
  const scalarHex = 'c87509a1c067115d2a8f8e7c1f3a9b6d4e2f0a1b3c5d7e9f00112233445566aa';
  const scalar = converter.hexToBase64(scalarHex);
  const ciphertextB64 =
    'BAABAAJ9AAQ8cq3bT98Jr5TwyU1/6So4an5wz4odhZFjhrslNcexsTswaw/ghWZdj8GyiuFnbNOtbgjq7aIl/jjQ2k3lVwPgRERERERERERERERE39swXW9F+dlAkGVh6h3GKlmYupkDAyD9uDDG1thiFXwuBD2b4nXat0+xDtoLKGluVVVVVVVVVVVVVVVVLAAAAAAAAAAiML/XtYqK2tHnBJiG/TF4aUypAIwbZsnv8NGcW5rVCnt+r8MhJETi4OQIWQ==';
  const plaintext = '{"hello":"garmin","spo2":97}';

  it('decrypts the canonical go-crypto vector', () => {
    expect(encrypter.decryptV4(scalar, ciphertextB64)).toBe(plaintext);
  });

  it('fails authentication with the wrong private key', () => {
    const wrongScalar = converter.hexToBase64(
      '1111111111111111111111111111111111111111111111111111111111111111'
    );
    expect(() => encrypter.decryptV4(wrongScalar, ciphertextB64)).toThrow();
  });
});

describe('HybridEncrypter v4 (AES recovery slot)', () => {
  const converter = new WebConverter();
  const encrypter = new HybridEncrypter(converter);
  // A base64 AES-256 recovery key (32 bytes) and an arbitrary phone scalar (unused by the
  // recovery path, but decryptV4 still requires the argument).
  const recoveryKeyB64 = 'TjYtXohpnhir+vUlv8UsUFAE+MNdazJb1psp4UZ2mic=';
  const phoneScalar = new WebConverter().hexToBase64(
    'c87509a1c067115d2a8f8e7c1f3a9b6d4e2f0a1b3c5d7e9f00112233445566aa'
  );

  // AES-256-GCM(key, nonce, plaintext) -> ciphertext||tag, matching HybridEncrypter's
  // private decryptAESGCM so the round-trip exercises the real unwrap path.
  const gcmSeal = (key: Uint8Array, nonce: Uint8Array, plaintext: Uint8Array): Uint8Array => {
    const cipher = forge.cipher.createCipher('AES-GCM', uint8ArrayToBinaryString(key));
    cipher.start({ iv: uint8ArrayToBinaryString(nonce) });
    cipher.update(forge.util.createBuffer(uint8ArrayToBinaryString(plaintext)));
    cipher.finish();
    const ct = binaryStringToUint8Array(cipher.output.getBytes());
    const tag = binaryStringToUint8Array(cipher.mode.tag.getBytes());
    const out = new Uint8Array(ct.length + tag.length);
    out.set(ct, 0);
    out.set(tag, ct.length);
    return out;
  };

  // Assemble a v4 ciphertext carrying only a mobile-app AES recovery slot (no EC slot):
  //   version(4) | payloadAlg(0) | slotCount(1)
  //     slot: decrypterId(0) | keyAlg(0=AES) | slotLen(uint16 LE) | nonce(12) | wrapped||tag
  //   payloadIv(12) | payloadLen(uint64 LE) | payload(ct||tag)
  // Hand-built so the parser is exercised independently of our own encoder; the pinned
  // go-crypto records below prove the real encoder agrees on this layout.
  const buildRecoveryOnlyV4 = (plaintext: string): string => {
    const recoveryKey = new Uint8Array(converter.base64ToArrayBuffer(recoveryKeyB64));
    const dataKey = new Uint8Array(32).fill(0x22);
    const slotNonce = new Uint8Array(12).fill(0x33);
    const payloadIv = new Uint8Array(12).fill(0x44);

    const wrappedDataKey = gcmSeal(recoveryKey, slotNonce, dataKey); // 32 + 16 tag = 48
    const slot = new Uint8Array(slotNonce.length + wrappedDataKey.length);
    slot.set(slotNonce, 0);
    slot.set(wrappedDataKey, slotNonce.length);

    const payload = gcmSeal(dataKey, payloadIv, utf8ToUint8Array(plaintext));

    const buf = new ArrayBuffer(3 + (2 + 2 + slot.length) + 12 + 8 + payload.length);
    const view = new DataView(buf);
    const out = new Uint8Array(buf);
    let o = 0;
    const putU8 = (v: number) => {
      view.setUint8(o, v);
      o += 1;
    };
    putU8(4); // version
    putU8(0); // payloadAlg = AES-GCM
    putU8(1); // slotCount
    putU8(0); // decrypterId = mobile app
    putU8(0); // keyAlg = AES symmetric
    view.setUint16(o, slot.length, true);
    o += 2;
    out.set(slot, o);
    o += slot.length;
    out.set(payloadIv, o);
    o += payloadIv.length;
    view.setUint32(o, payload.length, true);
    view.setUint32(o + 4, 0, true); // high 32 bits of the uint64 length
    o += 8;
    out.set(payload, o);
    return converter.arrayBufferToBase64(buf);
  };

  it('decrypts a v4 AES recovery slot with the recovery key', () => {
    const plaintext = '{"hello":"recovery","spo2":98}';
    const ciphertext = buildRecoveryOnlyV4(plaintext);
    expect(encrypter.decryptV4(phoneScalar, ciphertext, recoveryKeyB64)).toBe(plaintext);
  });

  it('throws when only an AES recovery slot is present but no recovery key is given', () => {
    const ciphertext = buildRecoveryOnlyV4('{"x":1}');
    expect(() => encrypter.decryptV4(phoneScalar, ciphertext)).toThrow(/recovery key/);
  });
});

describe('HybridEncrypter v4 encrypt + backward compatibility', () => {
  const converter = new WebConverter();
  const encrypter = new HybridEncrypter(converter);
  const recoveryKey = donorIdentity.keys.rec; // base64 AES-256 key
  const anyScalar = converter.hexToBase64(
    'c87509a1c067115d2a8f8e7c1f3a9b6d4e2f0a1b3c5d7e9f00112233445566aa'
  );

  it('encryptV4 + decryptV4 round-trip through the AES recovery slot', () => {
    const plaintext = '{"steps":1234,"spo2":97}';
    const ciphertext = encrypter.encryptV4(plaintext, [
      v4AesSlot(V4_DECRYPTER_MOBILE_APP, recoveryKey),
    ]);
    expect(encrypter.decryptV4(anyScalar, ciphertext, recoveryKey)).toBe(plaintext);
  });

  it('encryptV4 emits a donation (AES recovery + RSA target); decryptV4 opens the recovery slot', () => {
    const plaintext = '{"donation":"multi-recipient"}';
    const ciphertext = encrypter.encryptV4(plaintext, [
      v4AesSlot(V4_DECRYPTER_MOBILE_APP, recoveryKey),
      v4RsaSlot(V4_DECRYPTER_DATA_RECEIVER, testKey),
    ]);
    expect(encrypter.decryptV4(anyScalar, ciphertext, recoveryKey)).toBe(plaintext);
  });

  it('decryptV4 is backward compatible: it reads a pre-v4 (v3) ciphertext via the recovery key', () => {
    const plaintext = 'legacy v3 donation payload';
    const v3 = encrypter.encrypt(recoveryKey, plaintext, testKey);
    expect(encrypter.decryptV4(anyScalar, v3, recoveryKey)).toBe(plaintext);
  });
});

describe('HybridEncrypter v4 malformed-record handling', () => {
  const converter = new WebConverter();
  const encrypter = new HybridEncrypter(converter);
  const recoveryKey = donorIdentity.keys.rec;
  const anyScalar = converter.hexToBase64(
    'c87509a1c067115d2a8f8e7c1f3a9b6d4e2f0a1b3c5d7e9f00112233445566aa'
  );

  const truncate = (b64: string, bytes: number): string => {
    const full = new Uint8Array(converter.base64ToArrayBuffer(b64));
    return converter.uint8ArrayToBase64(full.subarray(0, full.length - bytes));
  };

  // Lengths inside a v4 record are attacker-controllable, so a truncated blob must fail
  // as a clear format error rather than a raw RangeError or a silently short slice.
  it('rejects a truncated payload with a descriptive error', () => {
    const ciphertext = encrypter.encryptV4('{"a":1}', [
      v4AesSlot(V4_DECRYPTER_MOBILE_APP, recoveryKey),
    ]);
    expect(() => encrypter.decryptV4(anyScalar, truncate(ciphertext, 8), recoveryKey)).toThrow(
      /Malformed v4 record/
    );
  });

  it('rejects a record truncated inside its slots', () => {
    const ciphertext = encrypter.encryptV4('{"a":1}', [
      v4AesSlot(V4_DECRYPTER_MOBILE_APP, recoveryKey),
    ]);
    // Cut deep enough to land inside the slot body + payload header.
    expect(() => encrypter.decryptV4(anyScalar, truncate(ciphertext, 60), recoveryKey)).toThrow(
      /Malformed v4 record/
    );
  });

  // Key rotation is a keychain concern, not a record one: a record carries ONE slot per
  // recipient (encrypted to whichever key was current), and the decrypter may hold several
  // keys for that recipient — the new one plus the retired one — so older records keep
  // opening. Mirrors go-crypto's TestHybridV4_Decrypter_KeyRotation.
  it('opens a record encrypted to a retired key when the keychain still holds it', () => {
    const retiredKey = converter.uint8ArrayToBase64(new Uint8Array(32).fill(0x0a));
    const currentKey = converter.uint8ArrayToBase64(new Uint8Array(32).fill(0x0b));
    const plaintext = '{"rotated":true}';
    // One slot, encrypted to the key that was current at the time.
    const ciphertext = encrypter.encryptV4(plaintext, [
      v4AesSlot(V4_DECRYPTER_MOBILE_APP, retiredKey),
    ]);

    // Keychain lists the current key first; the retired one still opens the old record.
    expect(
      encrypter.decryptV4WithKeys(ciphertext, [
        v4AesKey(V4_DECRYPTER_MOBILE_APP, currentKey),
        v4AesKey(V4_DECRYPTER_MOBILE_APP, retiredKey),
      ])
    ).toBe(plaintext);

    // Without the retired key in the chain, the record is no longer readable.
    expect(() =>
      encrypter.decryptV4WithKeys(ciphertext, [v4AesKey(V4_DECRYPTER_MOBILE_APP, currentKey)])
    ).toThrow(/No v4 slot could be opened/);
  });
});

describe('HybridEncrypter v4 generic keychain (all slot types)', () => {
  const converter = new WebConverter();
  const encrypter = new HybridEncrypter(converter);
  const recoveryKey = donorIdentity.keys.rec;

  // The format is generic: every algorithm must be encryptable and decryptable here, not
  // only the ones the phone happens to use today.
  it('round-trips an EC slot (the collector -> phone shape) produced by collect-lib', () => {
    const phonePriv = converter.uint8ArrayToBase64(new Uint8Array(32).fill(0x2b));
    const phonePubRaw = secp256k1.getPublicKey(converter.base64ToUint8Array(phonePriv), false);
    const plaintext = '{"ec":"round-trip"}';

    const ciphertext = encrypter.encryptV4(plaintext, [
      v4EcSlot(V4_DECRYPTER_MOBILE_APP, converter.uint8ArrayToBase64(phonePubRaw)),
    ]);
    expect(encrypter.decryptV4(phonePriv, ciphertext)).toBe(plaintext);
    expect(
      encrypter.decryptV4WithKeys(ciphertext, [v4EcKey(V4_DECRYPTER_MOBILE_APP, phonePriv)])
    ).toBe(plaintext);
  });

  it('round-trips an RSA slot via the keychain (receiver-side decryption)', () => {
    const pair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
    const plaintext = '{"rsa":"round-trip"}';
    const ciphertext = encrypter.encryptV4(plaintext, [
      v4RsaSlot(V4_DECRYPTER_DATA_RECEIVER, forge.pki.publicKeyToPem(pair.publicKey)),
    ]);
    expect(
      encrypter.decryptV4WithKeys(ciphertext, [
        v4RsaKey(V4_DECRYPTER_DATA_RECEIVER, forge.pki.privateKeyToPem(pair.privateKey)),
      ])
    ).toBe(plaintext);
  });

  it('opens each recipient of a three-slot record with its own key', () => {
    const pair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
    const phonePriv = converter.uint8ArrayToBase64(new Uint8Array(32).fill(0x3c));
    const phonePubRaw = secp256k1.getPublicKey(converter.base64ToUint8Array(phonePriv), false);
    const plaintext = '{"all":"three"}';

    const ciphertext = encrypter.encryptV4(plaintext, [
      v4EcSlot(V4_DECRYPTER_MOBILE_APP, converter.uint8ArrayToBase64(phonePubRaw)),
      v4AesSlot(V4_DECRYPTER_MOBILE_APP, recoveryKey),
      v4RsaSlot(V4_DECRYPTER_DATA_RECEIVER, forge.pki.publicKeyToPem(pair.publicKey)),
    ]);

    for (const key of [
      v4EcKey(V4_DECRYPTER_MOBILE_APP, phonePriv),
      v4AesKey(V4_DECRYPTER_MOBILE_APP, recoveryKey),
      v4RsaKey(V4_DECRYPTER_DATA_RECEIVER, forge.pki.privateKeyToPem(pair.privateKey)),
    ]) {
      expect(encrypter.decryptV4WithKeys(ciphertext, [key])).toBe(plaintext);
    }
  });

  it('refuses a slot addressed to another recipient', () => {
    const phonePriv = converter.uint8ArrayToBase64(new Uint8Array(32).fill(0x4d));
    const phonePubRaw = secp256k1.getPublicKey(converter.base64ToUint8Array(phonePriv), false);
    const ciphertext = encrypter.encryptV4('{"x":1}', [
      v4EcSlot(V4_DECRYPTER_MOBILE_APP, converter.uint8ArrayToBase64(phonePubRaw)),
    ]);
    // Right key material, wrong decrypterId -> no slot matches.
    expect(() =>
      encrypter.decryptV4WithKeys(ciphertext, [v4EcKey(V4_DECRYPTER_DATA_RECEIVER, phonePriv)])
    ).toThrow(/No v4 slot could be opened/);
  });
});

describe('HybridEncrypter v4 large payloads', () => {
  const converter = new WebConverter();
  const encrypter = new HybridEncrypter(converter);
  const recoveryKey = donorIdentity.keys.rec;
  const anyScalar = converter.hexToBase64(
    'c87509a1c067115d2a8f8e7c1f3a9b6d4e2f0a1b3c5d7e9f00112233445566aa'
  );

  // A single Garmin sync blob (detailed HR / activity JSON) easily passes the ~128 KB
  // point where String.fromCharCode.apply over the whole payload throws
  // "Maximum call stack size exceeded".
  it('round-trips a payload well past the call-argument limit', () => {
    const big = JSON.stringify({
      dailies: Array.from({ length: 20000 }, (_, i) => ({ t: i, hr: 60 + (i % 40) })),
    });
    expect(big.length).toBeGreaterThan(300_000);

    const ciphertext = encrypter.encryptV4(big, [v4AesSlot(V4_DECRYPTER_MOBILE_APP, recoveryKey)]);
    expect(encrypter.decryptV4(anyScalar, ciphertext, recoveryKey)).toBe(big);
  });
});

// Records produced by go-crypto v1.1.0 (d4lcrypto.EncryptHybridV4) with random keys and
// pinned here as snapshots. They cover the directions the deterministic EC vector above
// does not: go-crypto's AES-recovery encoder, and a multi-recipient record. Nonces are
// random, so these cannot be regenerated byte-identically — regenerate the whole block if
// the wire format intentionally changes.
describe('HybridEncrypter v4 cross-language (go-crypto -> collect-lib)', () => {
  const converter = new WebConverter();
  const encrypter = new HybridEncrypter(converter);
  const goRecoveryKeyB64 = 'AEVsPdSCeYz/SOe8mkdVEcysG+G3bCwv/TjNZmdGgek=';

  it('decrypts a go-crypto AES-recovery-only record with the recovery key', () => {
    const ciphertext =
      'BAABAAA8AMLkPWeX6H/m4SUlZ7aaFD0pJDlcNaA8xJ6sb66tOD4XqIWm2zpvCekCw5ZhUtuZr6bD1Ayq+fK1qG2bj2afbr/VQnVFeLXzwSQAAAAAAAAATVaeb4/+Wm3mLSj+puYTPeOaCXcNwyu1tOCO/K1lSgAJndzy';
    expect(encrypter.decryptV4('', ciphertext, goRecoveryKeyB64)).toBe('{"hello":"recovery"}');
  });

  it('decrypts the phone slot of a go-crypto multi-recipient record (EC + AES + RSA)', () => {
    const phonePrivB64 = 'TKK4Z6bGQQRQY6dbbdDmbcydGaWol2Ad4NbHtJ6kNHk=';
    const ciphertext =
      'BAADAAJ9AATgyvE/bB69jvi2DEyI5ehHqd6uX2BZqkyxB0yPtOyWtr19v08/jYd480xRo/neTo+3DDBw5lPok0yh+Th6MIFYURrVLjHkhYTUxZ4GEPkF1gWxRejjLmNirLReaEMzmCaapr2EP3VhxoUbkHiOCd+z/6nOt98eK2EVsXgLAAA8AGrg+5zq8v7MbcBWMxXqK7gd5qKmVT5k3ACwsB/tSCHS9HPEaF3qDRPxVXUHA5S7zc0FIS/Ta1b1P26JtwEBAAF2ENJepPKIh2KpBb5iBtvJA9j9AqMPHLQ2HrOu9cynXct/pheH3vSCr7V2QD/4O5yT0ivuBhLFu77zvusubDTozh00SqDTaBfBLHGMPjLrZieehWpcTm6gA84AHX0VctN2za8kde8J/nTRNNh1nIl9gP7IikDmggCtVgy5lmgpj6yV6Jm/WoNsNAc/m6fn+6m4Hsay2GrdkcWK8ruqvbE3QSMiHcKtF1c5rEs3gsznkBrBWKy+XsQ1ILBjdtAmV/H5FoRGSHs2Bp2ZiuR0LyMgmfK1yTL0M0Jaii0x5fEhJoX99yyxdEFcdG7qouzVtCevN7UEX5yBAfee4T4us5NlP+nFqc887EtnZGt7LwAAAAAAAACpggAGEm+GvrPe4sjJEikB108W0nS+ZO1vpAI5SNurkkFWmhnaBlmAKUSX9G6TMQ==';
    // The EC slot wins when present — it is the collector -> phone path.
    expect(encrypter.decryptV4(phonePrivB64, ciphertext, goRecoveryKeyB64)).toBe(
      '{"multi":"recipient","steps":7}'
    );
  });
});
