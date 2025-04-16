import * as secpUtils from '@noble/curves/abstract/utils';
import { secp256k1 } from '@noble/curves/secp256k1';
import * as bip39 from '@scure/bip39';
import { Buffer } from 'buffer/';
import * as forge from 'node-forge';
import { Converter } from '../helper/converter';
import wordlists, { WORDLIST_LANGUAGES, WordListLanguage } from '../helper/wordlists';
import { CryptoModule } from './crypto';
import { ERROR_MESSAGES } from './types';

export class KeyHandler {
  private converter;
  private crypto: CryptoModule;
  constructor(converter: Converter, crypto: CryptoModule) {
    this.converter = converter;
    this.crypto = crypto;
  }

  generateRecoveryKey(): Uint8Array {
    return this.crypto.generateKey(16);
  }

  validateRecoveryKey = (recoveryKey: Uint8Array) => {
    return recoveryKey.length === 16;
  };

  mnemonicToEntropy = (mnemonic: string, lng: string): Uint8Array => {
    if (!WORDLIST_LANGUAGES.includes(lng as WordListLanguage)) {
      lng = WORDLIST_LANGUAGES[0];
    }
    return bip39.mnemonicToEntropy(mnemonic, wordlists[lng as WordListLanguage]);
  };

  entropyToMnemonic = (entropy: Uint8Array | null, lng: string): string => {
    if (!WORDLIST_LANGUAGES.includes(lng as WordListLanguage)) {
      lng = WORDLIST_LANGUAGES[0];
    }
    if (entropy) {
      return bip39.entropyToMnemonic(entropy, wordlists[lng as WordListLanguage]);
    }
    return '';
  };

  /**
   * Derive all necessary program keys from the recovery phrase and the program name
   * @param recoveryKey The 16byte long recovery key (from the recovery phrase)
   * @param programName The name of the program for which the keys should be generated
   * @returns All necessary program keys
   */
  async deriveProgramKeys(recoveryKey: Uint8Array, programName: string) {
    // Generate private key, using the program name as a salt
    let privateProgramKey = await this.crypto.deriveEncryptionKey(recoveryKey, programName);

    // Check if the private key is valid. If it is invalid, use the private key as entropy to generate a new private key, again, using the program name as salt
    while (!secp256k1.utils.isValidPrivateKey(privateProgramKey)) {
      privateProgramKey = await this.crypto.deriveEncryptionKey(privateProgramKey, programName);
    }

    // Get public key for the private key
    const publicProgramKey = this.extendPublicKey(secp256k1.getPublicKey(privateProgramKey, false));

    // Extend the recovery based on the 16 byte entropy to 32 bytes
    const recoveryKey32 = await this.crypto.deriveEncryptionKey(recoveryKey, 'recovery');

    return {
      public: publicProgramKey,
      private: this.converter.hexToBase64(secpUtils.bytesToHex(privateProgramKey)),
      recovery: this.converter.uint8ArrayToBase64(recoveryKey32),
    };
  }

  extendPublicKey = (publicKey: Uint8Array): string => {
    let key = Buffer.from(publicKey);

    if (key.length !== 65) {
      throw new Error('Invalid public key length');
    }

    // Uncompressed key with 0x04 prefix, following x and y
    key = key.slice(1);

    // DER prefix; this is SEQUENCE { SEQUENCE { OID 1.2.840.10045.2.1 (ecPublicKey), OID 1.3.132.0.10 (secp256k1) }, BIT STRING prefix.
    const header = Buffer.from([
      0x30, 0x56, 0x30, 0x10, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x05,
      0x2b, 0x81, 0x04, 0x00, 0x0a, 0x03, 0x42, 0x00, 0x04,
    ]);

    return Buffer.concat([header, key]).toString('base64');
  };

  /**
   * Hash a message with SHA-256
   * @param message The message to hash
   * @returns The hashed message
   */
  hash = (message: string) => {
    const hash = forge.md.sha256.create().update(message).digest();
    return hash.toHex();
  };

  /**
   * Sign a message
   * @param message The message to sign
   * @param priv The private key used to sign the message
   * @returns The signed message
   */
  sign = async (message: string, priv: string): Promise<Uint8Array> => {
    try {
      // Create SHA256 sum
      const sha256 = this.hash(message);
      return secp256k1
        .sign(sha256, secpUtils.hexToBytes(this.converter.base64ToHex(priv)))
        .toCompactRawBytes();
    } catch (e) {
      console.error(e);
      throw new Error(ERROR_MESSAGES.COULD_NOT_SIGN);
    }
  };

  /**
   * Fetch the encoded signed buffer and verify it against the signature
   * @param message The signed message
   * @param signature The signature of the message
   * @param pub The public key used to verify the signature
   * @returns True, if the signature is valid. Otherwise, false.
   */
  verify = async (message: string, signature: Uint8Array, pub: string): Promise<boolean> => {
    const sha256 = this.hash(message);
    return secp256k1.verify(signature, sha256, this.converter.base64ToHex(pub));
  };
}
