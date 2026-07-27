import {
  HybridEncrypter,
  V4_DECRYPTER_DATA_RECEIVER,
  V4_DECRYPTER_MOBILE_APP,
  v4AesSlot,
  v4RsaSlot,
} from './hybridEncryption';
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
  // This is the layout go-crypto must emit for a recoverable v4 record (no encoder yet).
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
    const ciphertext = encrypter.encryptV4(plaintext, [v4AesSlot(V4_DECRYPTER_MOBILE_APP, recoveryKey)]);
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
