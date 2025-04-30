import {
  CryptoModule,
  KeyHandler,
  WebConverter,
  binaryStringToUint8Array,
  uint8ArrayToBinaryString,
} from '..';
import { WORDLIST_LANGUAGES, getLanguageOfPassPhrase } from '../helper/wordlists';
import crypto from 'node:crypto';

class NodeCrypto implements CryptoModule {
  generateKey(size: number): Uint8Array {
    return crypto.randomBytes(size);
  }

  deriveEncryptionKey = async (recoveryKey: Uint8Array, salt: string = 'phoenix') =>
    Buffer.from(crypto.pbkdf2Sync(recoveryKey, salt, 100000, 32, 'SHA-256'));
}

describe('Recovery Phrase Functions', () => {
  const validLng = WORDLIST_LANGUAGES[1];
  const converter = new WebConverter();
  const keyHandler = new KeyHandler(converter, new NodeCrypto());
  const invalidLng = 'invalid-lang'; // A language code that is not in WORDLIST_LANGUAGES

  describe('generateRecoveryPhrase', () => {
    it('should generate a 12-word recovery phrase for a valid language', () => {
      const key = keyHandler.generateRecoveryKey();
      const mnemonic = keyHandler.entropyToMnemonic(key, validLng);
      const words = mnemonic.split(' ');
      expect(words.length).toBe(12);
      expect(getLanguageOfPassPhrase(words)).toBe(validLng);
    });

    it('should fallback to the default language when an invalid language is provided', () => {
      const key = keyHandler.generateRecoveryKey();
      const mnemonic = keyHandler.entropyToMnemonic(key, invalidLng);
      const words = mnemonic.split(' ');
      expect(words.length).toBe(12);
      expect(getLanguageOfPassPhrase(words)).toBe(WORDLIST_LANGUAGES[0]);
    });
  });

  describe('Cross-function Consistency', () => {
    it('should maintain consistency between mnemonicToEntropy and entropyToMnemonic', () => {
      const key = keyHandler.generateRecoveryKey();
      const mnemonic = keyHandler.entropyToMnemonic(key, validLng);
      const entropy = keyHandler.mnemonicToEntropy(mnemonic, validLng);
      const mnemonicFromEntropy = keyHandler.entropyToMnemonic(entropy, validLng);
      expect(keyHandler.validateRecoveryKey(entropy)).toBe(true);
      expect(entropy.length).toBe(16);
      expect(mnemonicFromEntropy).toBe(mnemonic);
    });
  });
});

describe('Byte Array and Binary String Conversion Functions', () => {
  const converter = new WebConverter();
  describe('Cross-function Consistency - Binary String', () => {
    it('should convert a byte array containing 0 to a string', () => {
      const byteArray = new Uint8Array([0]);
      const binaryString = uint8ArrayToBinaryString(byteArray);
      expect(binaryString).toBe(String.fromCharCode(0));
      const resultByteArray = binaryStringToUint8Array(binaryString);
      expect(resultByteArray).toEqual(byteArray);
    });

    it('should convert a byte array containing 255 to a string', () => {
      const byteArray = new Uint8Array([255]);
      const binaryString = uint8ArrayToBinaryString(byteArray);
      expect(binaryString).toBe(String.fromCharCode(255));
      const resultByteArray = binaryStringToUint8Array(binaryString);
      expect(resultByteArray).toEqual(byteArray);
    });

    it('should handle a byte array with a mix of 0, 255, and other extreme values', () => {
      const byteArray = new Uint8Array([0, 255, 128, 127, 1, 2, 255, 254, 253]);
      const binaryString = uint8ArrayToBinaryString(byteArray);
      expect(binaryString).toBe(String.fromCharCode(0, 255, 128, 127, 1, 2, 255, 254, 253));
      const resultByteArray = binaryStringToUint8Array(binaryString);
      expect(resultByteArray).toEqual(byteArray);
    });

    it('should handle an empty byte array gracefully', () => {
      const byteArray = new Uint8Array([]);
      const binaryString = uint8ArrayToBinaryString(byteArray);
      expect(binaryString).toBe('');
      const resultByteArray = binaryStringToUint8Array(binaryString);
      expect(resultByteArray).toEqual(byteArray);
    });
  });

  describe('Cross-function Consistency - Base64 String', () => {
    it('should handle an empty byte array gracefully', () => {
      const byteArray = new Uint8Array([]);
      const base64String = uint8ArrayToBinaryString(byteArray);
      const resultByteArray = converter.base64ToUint8Array(base64String);
      expect(resultByteArray).toEqual(byteArray);
    });

    it('should maintain consistency when encoding and then decoding a Uint8Array', () => {
      const originalArray = new Uint8Array([0, 1, 2, 3, 4, 255]);
      const base64String = converter.uint8ArrayToBase64(originalArray);
      const resultArray = converter.base64ToUint8Array(base64String);
      expect(resultArray).toEqual(originalArray);
    });

    it('should maintain consistency when decoding and then encoding a base64 string', () => {
      const originalBase64 = 'SGVsbG8=';
      const byteArray = converter.base64ToUint8Array(originalBase64);
      const resultBase64 = converter.uint8ArrayToBase64(byteArray);
      expect(resultBase64).toBe(originalBase64);
    });
  });
});
