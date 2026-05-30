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
