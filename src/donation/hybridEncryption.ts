import { secp256k1 } from '@noble/curves/secp256k1';
import * as secpUtils from '@noble/curves/abstract/utils';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';
import { Buffer } from 'buffer/';
import * as forge from 'node-forge';
import {
  Converter,
  binaryStringToUint8Array,
  uint8ArrayToBinaryString,
  utf8ToUint8Array,
} from '../helper/converter';

/**
 * node-forge does not have documentation on the types, look up the
 * source code to find documentation https://github.com/digitalbazaar/forge/tree/main/lib
 * Important: strings coming out of node-forge are binary-encoded!
 */

export const AES_BLOCKSIZE = 16;
export const TAG_LENGTH = 16;
export const KEY_LENGTH = 32;
export const HYBRID_ENCRYPTION_VERSION_RECOVERY = 3;

// ---- v4 hybrid format (generic, slot-based; see go-crypto d4lcrypto/hybrid_v4.go) ----
export const HYBRID_ENCRYPTION_VERSION_V4 = 4;
const V4_PAYLOAD_ALG_AES_GCM = 0;
export const V4_DECRYPTER_MOBILE_APP = 0;
export const V4_DECRYPTER_DATA_RECEIVER = 1;
const V4_KEY_ALG_AES_SYM = 0; // data key wrapped under the symmetric recovery key (AES-256-GCM)
const V4_KEY_ALG_RSA_OAEP = 1; // data key wrapped to an RSA public key (RSA-OAEP/SHA-256)
const V4_KEY_ALG_EC = 2;
const V4_UNCOMPRESSED_PUBKEY_LENGTH = 65;
const V4_EC_NONCE_LENGTH = 12;
const V4_RECOVERY_NONCE_LENGTH = 12;
const V4_PAYLOAD_IV_LENGTH = 12;
const V4_GCM_TAG_LENGTH = 16;
// These MUST be byte-identical to the go-crypto implementation.
const V4_EC_SALT = utf8ToUint8Array('d4l/hybrid-v4/ec/salt');
const V4_EC_INFO = utf8ToUint8Array('d4l/hybrid-v4/ec/secp256k1/aes256gcm');

/**
 * V4SlotSpec describes one recipient of a v4 record: the (opaque) decrypter id, the wrap
 * algorithm, and the key material. Build it with v4AesSlot or v4RsaSlot.
 */
export interface V4SlotSpec {
  decrypterId: number;
  keyAlg: number;
  key: string; // base64 symmetric key (AES) or PEM public key (RSA)
}

/** v4AesSlot wraps the data key under a symmetric key (e.g. the recovery key) with AES-256-GCM. */
export const v4AesSlot = (decrypterId: number, symmetricKeyBase64: string): V4SlotSpec => ({
  decrypterId,
  keyAlg: V4_KEY_ALG_AES_SYM,
  key: symmetricKeyBase64,
});

/** v4RsaSlot wraps the data key to an RSA public key (PEM) with RSA-OAEP/SHA-256. */
export const v4RsaSlot = (decrypterId: number, publicKeyPem: string): V4SlotSpec => ({
  decrypterId,
  keyAlg: V4_KEY_ALG_RSA_OAEP,
  key: publicKeyPem,
});

export class HybridEncrypter {
  converter: Converter;

  constructor(converter: Converter) {
    this.converter = converter;
  }

  /**
   * Encrypt a donation
   * @param rec The base64 encoded symmetric recovery key
   * @param plaintext The data which should be encrypted
   * @param publicKey The public key of the donation target (in PEM format)
   * @returns The base64 encoded ArrayBuffer and encrypted donation and information for recovery
   */
  encrypt = (rec: string, plaintext: string, publicKey: string): string => {
    // Get version
    const version = HYBRID_ENCRYPTION_VERSION_RECOVERY;

    // Get data key (used to encrypt data which should be donated)
    const dataKey = this.getDataKey();

    // Encrypt data key with recovery key using AES GCM
    const recovery = this.encryptWithRecoveryKey(rec, dataKey);

    // Encrypt data key with the public key of the donation target using RSA OAEP
    const target = this.encryptWithTargetKey(publicKey, dataKey);

    // Encrypt donation
    const donation = this.encryptDonation(plaintext, dataKey);

    // Create buffer
    const bufferLength =
      1 +
      recovery.iv.byteLength + // 16
      1 +
      recovery.encryptedDataKey.byteLength +
      2 +
      target.encryptedDataKey.byteLength +
      donation.iv.byteLength + // 16
      8 +
      donation.encrypted.byteLength;

    const buffer = new ArrayBuffer(bufferLength);
    let dataView: DataView = new DataView(buffer);
    let offset = 0;

    // Write version (length 1)
    dataView.setUint8(0, version);
    offset++;

    // Write recovery data
    // - Write initialization vector (length 16)
    [dataView, offset] = setUint8Array(dataView, offset, recovery.iv);
    // - Write length of encrypted data key (length 1)
    dataView.setUint8(offset, recovery.encryptedDataKey.byteLength);
    offset += 1;
    // - Write encrypted data key
    [dataView, offset] = setUint8Array(dataView, offset, recovery.encryptedDataKey);

    // Write target data
    // - Write length of encrypted data key (length 2)
    dataView.setUint16(offset, target.encryptedDataKey.byteLength, true);
    offset += 2;
    // - Write encrypted data key
    [dataView, offset] = setUint8Array(dataView, offset, target.encryptedDataKey);

    // Write donation
    // - Write initialization vector (length 16)
    [dataView, offset] = setUint8Array(dataView, offset, donation.iv);
    // - Write length of encrypted donation (length 8)
    // The format requires a Uint64, which is not supported by Javascript, therefore we
    // are writing the information as 2 Uint32 entries. And since it should be written in accordance
    // with little endian, we are writing a 32bit-length first and a 32-bit 0 after
    dataView.setUint32(offset, donation.encrypted.byteLength, true);
    dataView.setUint32(offset + 4, 0, true);
    offset += 8;
    // - Write encrypted donation
    [dataView, offset] = setUint8Array(dataView, offset, new Uint8Array(donation.encrypted));

    // Return buffer
    return this.converter.arrayBufferToBase64(buffer);
  };

  /**
   * Decrypt a donation
   * @param rec The base64 encoded symmetric recovery key
   * @param cipherText The encrypted donation
   * @returns An string containing the decrypted donation
   */
  decrypt = (rec: string, cipherText: string): string => {
    const cipher = this.converter.base64ToArrayBuffer(cipherText);

    // Create DataView for buffer
    const dataView = new DataView(cipher);
    // Initialize offset
    let offset = 0;

    // Extract version
    const version = dataView.getUint8(offset);
    if (version !== HYBRID_ENCRYPTION_VERSION_RECOVERY) {
      throw new Error(
        `Version mismatch: Only version ${HYBRID_ENCRYPTION_VERSION_RECOVERY} is supported`
      );
    }
    offset++;

    // Read recovery data
    const recovery: {
      iv?: Uint8Array<ArrayBuffer>;
      encryptedDataKey?: Uint8Array<ArrayBuffer>;
      encryptedDataKeyLength?: number;
    } = {};
    // - Read initialization vector (length 16)
    recovery.iv = new Uint8Array(cipher.slice(offset, 16 + offset));
    offset += 16;
    // - Read length of encrypted data key (length 1)
    recovery.encryptedDataKeyLength = dataView.getUint8(offset);
    offset += 1;
    // - Read encrypted data key
    recovery.encryptedDataKey = new Uint8Array(
      cipher.slice(offset, recovery.encryptedDataKeyLength + offset)
    );
    offset += recovery.encryptedDataKeyLength;

    // Read target data
    const target: { encryptedDataKey?: Uint8Array; encryptedDataKeyLength?: number } = {};
    // - Read length of encrypted data key (length 2)
    target.encryptedDataKeyLength = dataView.getUint16(offset, true);
    offset += 2;
    // - Read encrypted data key
    target.encryptedDataKey = new Uint8Array(
      cipher.slice(offset, target.encryptedDataKeyLength + offset)
    );
    offset += target.encryptedDataKeyLength;

    // Read donation
    const donation: {
      iv?: Uint8Array<ArrayBuffer>;
      encrypted?: Uint8Array<ArrayBuffer>;
      encryptedDonationLength?: number;
    } = {};
    // - Read initialization vector (length 16)
    donation.iv = new Uint8Array(cipher.slice(offset, 16 + offset));
    offset += 16;
    // - Read length of encrypted donation (length 8)
    donation.encryptedDonationLength = dataView.getUint32(offset, true);
    offset += 8;
    // - Read encrypted donation
    donation.encrypted = new Uint8Array(
      cipher.slice(offset, donation.encryptedDonationLength + offset)
    );
    offset += donation.encryptedDonationLength;

    // Decrypt data key using recover key
    const decryptedDataKey = this.decryptWithRecoveryKey(
      rec,
      recovery.encryptedDataKey,
      recovery.iv
    );

    // Note: Don't decrypt the target-encrypted data key since we don't have the private key to do so

    // Decrypt the encrypted donation
    const decryptedDonation = this.decryptDonation(
      decryptedDataKey,
      donation.encrypted,
      donation.iv
    );

    // Buffer decoding works across browser and React Native via the existing buffer polyfill.
    return Buffer.from(decryptedDonation).toString('utf8');
  };

  /**
   * Decrypt a v4 hybrid ciphertext addressed to the mobile app. The normal path is the EC
   * slot (ECIES over secp256k1) the data-collector encrypts to the phone's derived key.
   *
   * The AES-256 recovery key is a durable fallback across formats, so it is consulted for
   * two kinds of input:
   *   - a pre-v4 (v1–v3) ciphertext, delegated to the legacy recovery-key path; and
   *   - a v4 ciphertext that carries an AES recovery slot (decrypterId = mobile app,
   *     keyAlg = AES symmetric) but no usable EC slot — the same recovery key that could
   *     recover pre-v4 records then recovers v4 records too.
   * The EC slot is always preferred when present; the recovery key is only needed to fall
   * back to the AES slot (or a pre-v4 blob).
   * @param privateKeyHex The phone's encryption private key (secp256k1 scalar, hex)
   * @param cipherText The base64-encoded ciphertext (v4, or v1–v3 for the fallback)
   * @param recoveryKey Base64 recovery key; needed only for the AES-recovery or pre-v4 paths
   * @returns The decrypted UTF-8 string
   */
  decryptV4 = (privateKeyHex: string, cipherText: string, recoveryKey?: string): string => {
    const buffer = this.converter.base64ToArrayBuffer(cipherText);
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    let offset = 0;

    // Header: version | payloadAlg | slotCount
    const version = view.getUint8(offset);
    offset += 1;
    if (version !== HYBRID_ENCRYPTION_VERSION_V4) {
      // Pre-v4 backward compatibility: decrypt through the legacy recovery-key path.
      if (recoveryKey === undefined) {
        throw new Error(`Cannot decrypt v${version} ciphertext without a recovery key`);
      }
      return this.decrypt(recoveryKey, cipherText);
    }
    const payloadAlg = view.getUint8(offset);
    offset += 1;
    if (payloadAlg !== V4_PAYLOAD_ALG_AES_GCM) {
      throw new Error('Unsupported v4 payload algorithm');
    }
    const slotCount = view.getUint8(offset);
    offset += 1;

    // Slots: decrypterId | keyAlg | slotLen(uint16 LE) | slot. The mobile app can be
    // addressed by an EC slot (the collector→phone path) and/or an AES slot wrapped under
    // the recovery key (the durable recovery path, mirroring pre-v4 records).
    let ecSlot: Uint8Array | undefined;
    let recoverySlot: Uint8Array | undefined;
    for (let i = 0; i < slotCount; i++) {
      const decrypterId = view.getUint8(offset);
      offset += 1;
      const keyAlg = view.getUint8(offset);
      offset += 1;
      const slotLen = view.getUint16(offset, true);
      offset += 2;
      const slot = bytes.slice(offset, offset + slotLen);
      offset += slotLen;
      if (decrypterId !== V4_DECRYPTER_MOBILE_APP) {
        continue;
      }
      if (keyAlg === V4_KEY_ALG_EC) {
        ecSlot = slot;
      } else if (keyAlg === V4_KEY_ALG_AES_SYM) {
        recoverySlot = slot;
      }
    }

    // Payload: iv(12) | payloadLen(uint64 LE) | ciphertext||tag
    const payloadIv = bytes.slice(offset, offset + V4_PAYLOAD_IV_LENGTH);
    offset += V4_PAYLOAD_IV_LENGTH;
    const payloadLen = view.getUint32(offset, true);
    const payloadLenHigh = view.getUint32(offset + 4, true);
    offset += 8;
    if (payloadLenHigh !== 0) {
      throw new Error('v4 payload too large');
    }
    const payload = bytes.slice(offset, offset + payloadLen);

    // Prefer the EC slot (the phone's deterministic encryption key); fall back to the AES
    // recovery slot when only that is present and a recovery key is available.
    const dataKey = this.unwrapV4DataKey(ecSlot, recoverySlot, privateKeyHex, recoveryKey);
    const plaintext = this.decryptAESGCM(dataKey, payloadIv, payload);
    return Buffer.from(plaintext).toString('utf8');
  };

  /**
   * Encrypt plaintext once under a random data key and wrap that key into one slot per
   * recipient (decryptV4 is the inverse). Slot decrypterIds are opaque to this class; callers
   * assign their meaning. Mirrors go-crypto's EncryptHybridV4.
   * @param plaintext The data to encrypt
   * @param slots One slot per party that must recover the data (see v4AesSlot / v4RsaSlot)
   * @returns The base64-encoded v4 ciphertext
   */
  encryptV4 = (plaintext: string, slots: V4SlotSpec[]): string => {
    if (slots.length === 0) {
      throw new Error('encryptV4 requires at least one slot');
    }
    const dataKey = binaryStringToUint8Array(this.getDataKey());
    const payloadIv = binaryStringToUint8Array(forge.random.getBytesSync(V4_PAYLOAD_IV_LENGTH));
    const payload = this.encryptAESGCM(dataKey, payloadIv, utf8ToUint8Array(plaintext));

    const wrapped = slots.map((slot) => ({
      decrypterId: slot.decrypterId,
      keyAlg: slot.keyAlg,
      blob: this.wrapV4Slot(slot, dataKey),
    }));
    return this.encodeV4(wrapped, payloadIv, payload);
  };

  /** wrapV4Slot wraps dataKey for one recipient, dispatching on the slot's key algorithm. */
  private wrapV4Slot = (slot: V4SlotSpec, dataKey: Uint8Array): Uint8Array => {
    switch (slot.keyAlg) {
      case V4_KEY_ALG_AES_SYM:
        return this.wrapV4RecoveryDataKey(
          new Uint8Array(this.converter.base64ToArrayBuffer(slot.key)),
          dataKey
        );
      case V4_KEY_ALG_RSA_OAEP:
        // Reuse the existing RSA-OAEP wrap; the blob is the wrapped data key.
        return this.encryptWithTargetKey(slot.key, uint8ArrayToBinaryString(dataKey))
          .encryptedDataKey;
      default:
        throw new Error(`encryptV4: unsupported key algorithm ${slot.keyAlg}`);
    }
  };

  /**
   * Wrap the data key under a symmetric key with AES-256-GCM — the inverse of
   * unwrapV4RecoveryDataKey. Layout: nonce(12) | wrappedDataKey||tag.
   */
  private wrapV4RecoveryDataKey = (symmetricKey: Uint8Array, dataKey: Uint8Array): Uint8Array => {
    const nonce = binaryStringToUint8Array(forge.random.getBytesSync(V4_RECOVERY_NONCE_LENGTH));
    const wrapped = this.encryptAESGCM(symmetricKey, nonce, dataKey);
    const out = new Uint8Array(nonce.length + wrapped.length);
    out.set(nonce, 0);
    out.set(wrapped, nonce.length);
    return out;
  };

  /** encodeV4 assembles the v4 record: header | slots | payloadIv | payloadLen | payload. */
  private encodeV4 = (
    slots: { decrypterId: number; keyAlg: number; blob: Uint8Array }[],
    payloadIv: Uint8Array,
    payload: Uint8Array
  ): string => {
    let total = 3; // version | payloadAlg | slotCount
    for (const slot of slots) {
      total += 2 + 2 + slot.blob.length; // decrypterId | keyAlg | slotLen(2) | slot
    }
    total += payloadIv.length + 8 + payload.length; // payloadIv | payloadLen(8) | payload

    const buffer = new ArrayBuffer(total);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);
    let offset = 0;

    view.setUint8(offset, HYBRID_ENCRYPTION_VERSION_V4);
    offset += 1;
    view.setUint8(offset, V4_PAYLOAD_ALG_AES_GCM);
    offset += 1;
    view.setUint8(offset, slots.length);
    offset += 1;

    for (const slot of slots) {
      view.setUint8(offset, slot.decrypterId);
      offset += 1;
      view.setUint8(offset, slot.keyAlg);
      offset += 1;
      view.setUint16(offset, slot.blob.length, true);
      offset += 2;
      bytes.set(slot.blob, offset);
      offset += slot.blob.length;
    }

    bytes.set(payloadIv, offset);
    offset += payloadIv.length;
    view.setUint32(offset, payload.length, true);
    view.setUint32(offset + 4, 0, true); // high 32 bits of the uint64 length
    offset += 8;
    bytes.set(payload, offset);

    return this.converter.arrayBufferToBase64(buffer);
  };

  /** Encrypt with AES-256-GCM (ciphertext||tag) — the inverse of decryptAESGCM. */
  private encryptAESGCM = (key: Uint8Array, iv: Uint8Array, plaintext: Uint8Array): Uint8Array => {
    const cipher = forge.cipher.createCipher('AES-GCM', uint8ArrayToBinaryString(key));
    cipher.start({ iv: uint8ArrayToBinaryString(iv) });
    cipher.update(forge.util.createBuffer(uint8ArrayToBinaryString(plaintext)));
    cipher.finish();
    const ciphertext = binaryStringToUint8Array(cipher.output.getBytes());
    const tag = binaryStringToUint8Array(cipher.mode.tag.getBytes());
    const out = new Uint8Array(ciphertext.length + tag.length);
    out.set(ciphertext, 0);
    out.set(tag, ciphertext.length);
    return out;
  };

  /** Recover the payload data key from whichever mobile-app slot is present (EC preferred). */
  private unwrapV4DataKey = (
    ecSlot: Uint8Array | undefined,
    recoverySlot: Uint8Array | undefined,
    privateKeyHex: string,
    recoveryKey?: string
  ): Uint8Array => {
    if (ecSlot) {
      return this.unwrapV4EcDataKey(ecSlot, privateKeyHex);
    }
    if (recoverySlot) {
      if (recoveryKey === undefined) {
        throw new Error(
          'v4 ciphertext has only an AES recovery slot but no recovery key was provided'
        );
      }
      return this.unwrapV4RecoveryDataKey(recoverySlot, recoveryKey);
    }
    throw new Error('No decryptable slot for the mobile app in v4 ciphertext');
  };

  /**
   * Unwrap the data key from an EC slot via ECIES.
   * Slot layout: ephPub(65, uncompressed) | nonce(12) | wrappedDataKey||tag(48).
   */
  private unwrapV4EcDataKey = (ecSlot: Uint8Array, privateKeyHex: string): Uint8Array => {
    const ephemeralPublicKey = ecSlot.slice(0, V4_UNCOMPRESSED_PUBKEY_LENGTH);
    const ecNonce = ecSlot.slice(
      V4_UNCOMPRESSED_PUBKEY_LENGTH,
      V4_UNCOMPRESSED_PUBKEY_LENGTH + V4_EC_NONCE_LENGTH
    );
    const wrappedDataKey = ecSlot.slice(V4_UNCOMPRESSED_PUBKEY_LENGTH + V4_EC_NONCE_LENGTH);

    // ECDH(phonePriv, ephPub) -> X coordinate -> HKDF-SHA256 -> AES-256-GCM key.
    const privateKey = secpUtils.hexToBytes(privateKeyHex);
    const sharedPoint = secp256k1.getSharedSecret(privateKey, ephemeralPublicKey); // 33-byte compressed
    const sharedX = sharedPoint.slice(1, 33);
    const wrappingKey = hkdf(sha256, sharedX, V4_EC_SALT, V4_EC_INFO, 32);
    return this.decryptAESGCM(wrappingKey, ecNonce, wrappedDataKey);
  };

  /**
   * Unwrap the data key from an AES recovery slot: the data key wrapped directly under the
   * base64 AES-256 recovery key (the same key the pre-v4 recovery branch uses).
   * Slot layout: nonce(12) | wrappedDataKey||tag(48).
   */
  private unwrapV4RecoveryDataKey = (recoverySlot: Uint8Array, recoveryKey: string): Uint8Array => {
    const nonce = recoverySlot.slice(0, V4_RECOVERY_NONCE_LENGTH);
    const wrappedDataKey = recoverySlot.slice(V4_RECOVERY_NONCE_LENGTH);
    const key = new Uint8Array(this.converter.base64ToArrayBuffer(recoveryKey));
    return this.decryptAESGCM(key, nonce, wrappedDataKey);
  };

  /**
   * Decrypt an AES-256-GCM ciphertext (ciphertext||tag) with a 12-byte nonce.
   */
  private decryptAESGCM = (
    key: Uint8Array,
    iv: Uint8Array,
    ciphertextWithTag: Uint8Array
  ): Uint8Array => {
    const ciphertext = ciphertextWithTag.slice(0, -V4_GCM_TAG_LENGTH);
    const tag = ciphertextWithTag.slice(-V4_GCM_TAG_LENGTH);
    // forge is driven with binary strings (its native representation) — the typed-array
    // overloads reject Uint8Array<ArrayBufferLike> under newer TS lib generics.
    const decipher = forge.cipher.createDecipher('AES-GCM', uint8ArrayToBinaryString(key));
    decipher.start({
      iv: uint8ArrayToBinaryString(iv),
      tag: forge.util.createBuffer(uint8ArrayToBinaryString(tag)),
    });
    decipher.update(forge.util.createBuffer(uint8ArrayToBinaryString(ciphertext)));
    if (!decipher.finish()) {
      throw new Error('AES-GCM authentication failed');
    }
    return binaryStringToUint8Array(decipher.output.getBytes());
  };

  private getDataKey = (): string => {
    // Generate random symmetric key
    return forge.random.getBytesSync(KEY_LENGTH);
  };

  /**
   * Encrypt the data key with a base64 encoded recovery key
   * @param rec The base64 encoded symmetric recovery phrase
   * @param dataKey The random data key
   * @returns The encrypted data key, the used initialization vector
   */
  private encryptWithRecoveryKey = (
    rec: string,
    dataKey: string
  ): { iv: Uint8Array; encryptedDataKey: Uint8Array } => {
    const iv = forge.random.getBytesSync(AES_BLOCKSIZE);

    const cipher = forge.cipher.createCipher('AES-CBC', forge.util.decode64(rec));
    cipher.start({ iv });
    cipher.update(forge.util.createBuffer(dataKey));
    cipher.finish();
    const encrypted = cipher.output.getBytes();

    return {
      iv: binaryStringToUint8Array(iv),
      encryptedDataKey: binaryStringToUint8Array(encrypted),
    };
  };

  /**
   * Decrypt the data key using the base64 encoded symmetric recovery key and a given initialization vector
   * @param rec The base64 encoded symmetric recovery key
   * @param encryptedDataKey The encrypted data key
   * @param iv The used initialization vector
   * @returns The decrypted data key
   */
  private decryptWithRecoveryKey = (
    rec: string,
    encryptedDataKey: Uint8Array<ArrayBuffer>,
    iv: Uint8Array<ArrayBuffer>
  ): Uint8Array<ArrayBuffer> => {
    const cipher = forge.cipher.createDecipher('AES-CBC', forge.util.decode64(rec));
    cipher.start({ iv: forge.util.createBuffer(iv) });
    cipher.update(forge.util.createBuffer(encryptedDataKey));
    cipher.finish();
    const encrypted = cipher.output.getBytes();
    return binaryStringToUint8Array(encrypted);
  };

  /**
   * Encrypt data key with the public key of the donation target using RSA OAEP
   * @param targetKey The public key of the donation target
   * @param dataKey The random data key
   * @returns The encrypted data key
   */
  private encryptWithTargetKey = (
    targetKey: string,
    dataKey: string
  ): { encryptedDataKey: Uint8Array } => {
    const publicKey = forge.pki.publicKeyFromPem(targetKey);
    const enc = publicKey.encrypt(dataKey, 'RSA-OAEP', { md: forge.md.sha256.create() });
    return { encryptedDataKey: binaryStringToUint8Array(enc) };
  };

  /**
   * Encrypt the stringified donation using the data key
   * @param donation The stringified version of what should be donated
   * @param dataKey The key to encrypt the donation with
   * @returns The encrypted donation, the used initialization vector and the length of the encrypted donation
   */
  private encryptDonation = (
    donation: string,
    dataKey: string
  ): { iv: Uint8Array; encrypted: Uint8Array<ArrayBuffer> } => {
    try {
      const iv = forge.random.getBytesSync(AES_BLOCKSIZE);

      const cipher = forge.cipher.createCipher('AES-GCM', dataKey);
      cipher.start({ iv: iv });
      cipher.update(forge.util.createBuffer(utf8ToUint8Array(donation)));
      cipher.finish();
      const encrypted = cipher.output.getBytes();
      const tag = cipher.mode.tag.getBytes();

      return {
        iv: binaryStringToUint8Array(iv),
        encrypted: Buffer.concat([
          binaryStringToUint8Array(encrypted),
          binaryStringToUint8Array(tag),
        ]),
      };
    } catch (error) {
      console.error(`[HybridEncrypter] encrypt: ${error}`);
      return {} as any;
    }
  };

  private decryptDonation = (
    dataKey: Uint8Array<ArrayBuffer>,
    encryptedDonation: Uint8Array<ArrayBuffer>,
    iv: Uint8Array<ArrayBuffer>
  ): Uint8Array<ArrayBuffer> => {
    try {
      const encryptedData = encryptedDonation.slice(0, -TAG_LENGTH);
      const tag = encryptedDonation.slice(-TAG_LENGTH);
      const cipher = forge.cipher.createDecipher('AES-GCM', forge.util.createBuffer(dataKey));
      cipher.start({ iv: forge.util.createBuffer(iv), tag: forge.util.createBuffer(tag) });
      cipher.update(forge.util.createBuffer(encryptedData));
      const pass = cipher.finish();
      if (pass) {
        const decrypted = cipher.output.getBytes();
        return binaryStringToUint8Array(decrypted);
      }
      return new Uint8Array();
    } catch (error) {
      console.error(`[HybridEncrypter] decrypt: ${error}`);
      return new Uint8Array();
    }
  };
}
/**
 * Add values to a DataView at a certain position
 * @param dataView The data view to which the values should be added
 * @param offset The offset where the values should be added
 * @param values The values that should be added
 */
const setUint8Array = (
  dataView: DataView,
  offset: number,
  values: Uint8Array
): [DataView, number] => {
  for (const value of values) {
    dataView.setUint8(offset, value);
    offset++;
  }
  return [dataView, offset];
};
