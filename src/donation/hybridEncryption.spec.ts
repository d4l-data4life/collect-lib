import { HybridEncrypter } from './hybridEncryption';
import { WebConverter } from '..';

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
  const encrypter = new HybridEncrypter(new WebConverter());

  // Canonical cross-language vector — produced by go-crypto's
  // d4lcrypto.TestHybridV4_DeterministicVector. If this test fails, the v4 wire format
  // has drifted between go-crypto (encode) and collect-lib (decode).
  const scalarHex = 'c87509a1c067115d2a8f8e7c1f3a9b6d4e2f0a1b3c5d7e9f00112233445566aa';
  const ciphertextB64 =
    'BAABAAJ9AAQ8cq3bT98Jr5TwyU1/6So4an5wz4odhZFjhrslNcexsTswaw/ghWZdj8GyiuFnbNOtbgjq7aIl/jjQ2k3lVwPgRERERERERERERERE39swXW9F+dlAkGVh6h3GKlmYupkDAyD9uDDG1thiFXwuBD2b4nXat0+xDtoLKGluVVVVVVVVVVVVVVVVLAAAAAAAAAAiML/XtYqK2tHnBJiG/TF4aUypAIwbZsnv8NGcW5rVCnt+r8MhJETi4OQIWQ==';
  const plaintext = '{"hello":"garmin","spo2":97}';

  it('decrypts the canonical go-crypto vector', () => {
    expect(encrypter.decryptV4(scalarHex, ciphertextB64)).toBe(plaintext);
  });

  it('fails authentication with the wrong private key', () => {
    const wrongScalar = '1111111111111111111111111111111111111111111111111111111111111111';
    expect(() => encrypter.decryptV4(wrongScalar, ciphertextB64)).toThrow();
  });
});
