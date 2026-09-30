import { secp256k1 } from '@noble/curves/secp256k1';
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
 * algorithm, and the public/symmetric key material. Build it with v4AesSlot, v4RsaSlot or
 * v4EcSlot — the same three algorithms go-crypto's ECSlot/RSASlot/AESSlot produce.
 */
export interface V4SlotSpec {
  decrypterId: number;
  keyAlg: number;
  key: string; // base64 symmetric key (AES), PEM public key (RSA) or base64 SPKI key (EC)
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

/**
 * v4EcSlot wraps the data key to a secp256k1 public key via ECIES — the counterpart of
 * what the data-collector emits for the phone.
 * @param decrypterId The recipient this slot is addressed to
 * @param publicKeyBase64 SPKI public key, as returned by KeyHandler.deriveEncryptionKeypair
 */
export const v4EcSlot = (decrypterId: number, publicKeyBase64: string): V4SlotSpec => ({
  decrypterId,
  keyAlg: V4_KEY_ALG_EC,
  key: publicKeyBase64,
});

/**
 * V4KeySpec is one entry of a decryption keychain: the recipient identity and algorithm of
 * the slots it can open, plus the private/symmetric key material. Build it with v4AesKey,
 * v4RsaKey or v4EcKey. Mirrors go-crypto's AESKey/RSAKey/ECKey.
 */
export interface V4KeySpec {
  decrypterId: number;
  keyAlg: number;
  key: string; // base64 symmetric key (AES), PEM private key (RSA) or base64 scalar (EC)
}

/** v4AesKey opens AES-symmetric slots (e.g. the donor's recovery key). */
export const v4AesKey = (decrypterId: number, symmetricKeyBase64: string): V4KeySpec => ({
  decrypterId,
  keyAlg: V4_KEY_ALG_AES_SYM,
  key: symmetricKeyBase64,
});

/** v4RsaKey opens RSA-OAEP slots with a PEM private key. */
export const v4RsaKey = (decrypterId: number, privateKeyPem: string): V4KeySpec => ({
  decrypterId,
  keyAlg: V4_KEY_ALG_RSA_OAEP,
  key: privateKeyPem,
});

/** v4EcKey opens EC (ECIES secp256k1) slots with a base64 scalar. */
export const v4EcKey = (decrypterId: number, privateKeyBase64: string): V4KeySpec => ({
  decrypterId,
  keyAlg: V4_KEY_ALG_EC,
  key: privateKeyBase64,
});

/**
 * Assert a v4 record still holds `length` bytes at `offset`, so lengths taken from the
 * record itself cannot run past its end.
 * @param bytes The whole v4 record
 * @param offset Where the field starts
 * @param length How many bytes the field claims
 * @param what Field name, for the error message
 */
const requireV4Bytes = (bytes: Uint8Array, offset: number, length: number, what: string): void => {
  if (length < 0 || offset + length > bytes.length) {
    throw new Error(
      `Malformed v4 record: ${what} needs ${length} bytes at offset ${offset}, ` +
        `but the record is only ${bytes.length} bytes`
    );
  }
};

/** One slot as it appears on the wire, before any key has been matched against it. */
interface DecodedV4Slot {
  decrypterId: number;
  keyAlg: number;
  blob: Uint8Array;
}

/** A parsed v4 record: its slots plus the AES-GCM payload. */
interface DecodedV4Record {
  slots: DecodedV4Slot[];
  payloadIv: Uint8Array;
  payload: Uint8Array;
}

/**
 * Reduce a secp256k1 public key to the raw uncompressed point the curve functions expect.
 * Donor keys are SPKI-wrapped (see KeyHandler.extendPublicKey), whose wrapper ends with the
 * 0x04 point prefix — so the raw key is its last 65 bytes. Raw keys pass through.
 * @param publicKey SPKI-wrapped or raw uncompressed public key
 * @returns The 65-byte uncompressed point (0x04 || X || Y)
 */
const rawEcPublicKey = (publicKey: Uint8Array): Uint8Array => {
  if (publicKey.length === V4_UNCOMPRESSED_PUBKEY_LENGTH) {
    return publicKey;
  }
  if (publicKey.length < V4_UNCOMPRESSED_PUBKEY_LENGTH) {
    throw new Error(`Invalid secp256k1 public key length: ${publicKey.length}`);
  }
  return publicKey.subarray(publicKey.length - V4_UNCOMPRESSED_PUBKEY_LENGTH);
};

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
   *   - a v3 ciphertext, delegated to the legacy recovery-key path (`decrypt`); and
   *   - a v4 ciphertext that carries an AES recovery slot (decrypterId = mobile app,
   *     keyAlg = AES symmetric) but no usable EC slot — the same recovery key that could
   *     recover v3 records then recovers v4 records too.
   * The EC slot is always preferred when present; the recovery key is only needed to fall
   * back to the AES slot (or a v3 blob).
   *
   * Note the legacy branch is v3-only, matching `decrypt`: v1 (AES-CBC) and v2 (AES-GCM)
   * are single-recipient formats this library never produced — donations have always been
   * written with a recovery branch — so a v1/v2 blob is rejected rather than decrypted.
   * @param privateKey The phone's encryption private key (secp256k1 scalar, base64 — as
   *                    returned by KeyHandler.deriveEncryptionKeypair)
   * @param cipherText The base64-encoded ciphertext (v4, or v3 for the legacy fallback)
   * @param recoveryKey Base64 recovery key; needed only for the AES-recovery or v3 paths
   * @returns The decrypted UTF-8 string
   */
  decryptV4 = (privateKey: string, cipherText: string, recoveryKey?: string): string => {
    const version = new Uint8Array(this.converter.base64ToArrayBuffer(cipherText))[0];
    if (version !== HYBRID_ENCRYPTION_VERSION_V4) {
      // Legacy (v3) backward compatibility: decrypt through the recovery-key path, which
      // rejects any other version itself.
      if (recoveryKey === undefined) {
        throw new Error(`Cannot decrypt v${version} ciphertext without a recovery key`);
      }
      return this.decrypt(recoveryKey, cipherText);
    }

    const keys: V4KeySpec[] = [v4EcKey(V4_DECRYPTER_MOBILE_APP, privateKey)];
    if (recoveryKey !== undefined) {
      keys.push(v4AesKey(V4_DECRYPTER_MOBILE_APP, recoveryKey));
    }
    const record = this.decodeV4(cipherText);
    const hasRecoverySlot = record.slots.some(
      (s) => s.decrypterId === V4_DECRYPTER_MOBILE_APP && s.keyAlg === V4_KEY_ALG_AES_SYM
    );
    if (recoveryKey === undefined && hasRecoverySlot) {
      // Keep this specific: the caller holds the one thing that would have worked.
      throw new Error('v4 ciphertext has an AES recovery slot but no recovery key was provided');
    }
    return this.openV4Record(record, keys);
  };

  /**
   * Decrypt a v4 record with an explicit keychain — the generic entry point, mirroring
   * go-crypto's `NewDecrypterFromKeys`. A slot is opened only by a key whose
   * (decrypterId, keyAlg) match, and every matching key is tried, so a record carrying
   * several slots for the same recipient (e.g. a rotated recovery key) still opens.
   * @param cipherText The base64-encoded v4 ciphertext
   * @param keys Keychain entries, built with v4EcKey / v4AesKey / v4RsaKey
   * @returns The decrypted UTF-8 string
   */
  decryptV4WithKeys = (cipherText: string, keys: V4KeySpec[]): string =>
    this.openV4Record(this.decodeV4(cipherText), keys);

  /** Unwrap the data key with the first matching key, then open the payload. */
  private openV4Record = (record: DecodedV4Record, keys: V4KeySpec[]): string => {
    const dataKey = this.unwrapV4DataKey(record.slots, keys);
    const plaintext = this.decryptAESGCM(dataKey, record.payloadIv, record.payload);
    return Buffer.from(plaintext).toString('utf8');
  };

  /**
   * Parse a v4 record into its slots and payload. Every length comes from the record
   * itself, so each read is bounds-checked first: a truncated or malformed blob fails as a
   * clear format error instead of a raw RangeError or a silently short slice.
   * @param cipherText The base64-encoded v4 ciphertext
   * @returns The decoded slots, payload IV and payload
   */
  private decodeV4 = (cipherText: string): DecodedV4Record => {
    const buffer = this.converter.base64ToArrayBuffer(cipherText);
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    let offset = 0;

    // Header: version | payloadAlg | slotCount
    requireV4Bytes(bytes, offset, 3, 'header');
    const version = view.getUint8(offset);
    offset += 1;
    if (version !== HYBRID_ENCRYPTION_VERSION_V4) {
      throw new Error(`Not a v4 record: version ${version}`);
    }
    const payloadAlg = view.getUint8(offset);
    offset += 1;
    if (payloadAlg !== V4_PAYLOAD_ALG_AES_GCM) {
      throw new Error('Unsupported v4 payload algorithm');
    }
    const slotCount = view.getUint8(offset);
    offset += 1;

    // Slots: decrypterId | keyAlg | slotLen(uint16 LE) | slot. All of them are kept —
    // which ones are usable is decided by the keychain, not by this parser.
    const slots: DecodedV4Slot[] = [];
    for (let i = 0; i < slotCount; i++) {
      requireV4Bytes(bytes, offset, 4, `slot ${i} header`);
      const decrypterId = view.getUint8(offset);
      offset += 1;
      const keyAlg = view.getUint8(offset);
      offset += 1;
      const slotLen = view.getUint16(offset, true);
      offset += 2;
      requireV4Bytes(bytes, offset, slotLen, `slot ${i} body`);
      slots.push({ decrypterId, keyAlg, blob: bytes.slice(offset, offset + slotLen) });
      offset += slotLen;
    }

    // Payload: iv(12) | payloadLen(uint64 LE) | ciphertext||tag
    requireV4Bytes(bytes, offset, V4_PAYLOAD_IV_LENGTH + 8, 'payload header');
    const payloadIv = bytes.slice(offset, offset + V4_PAYLOAD_IV_LENGTH);
    offset += V4_PAYLOAD_IV_LENGTH;
    const payloadLen = view.getUint32(offset, true);
    const payloadLenHigh = view.getUint32(offset + 4, true);
    offset += 8;
    if (payloadLenHigh !== 0) {
      throw new Error('v4 payload too large');
    }
    requireV4Bytes(bytes, offset, payloadLen, 'payload');
    return { slots, payloadIv, payload: bytes.slice(offset, offset + payloadLen) };
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
      case V4_KEY_ALG_EC:
        return this.wrapV4EcDataKey(slot.key, dataKey);
      default:
        throw new Error(`encryptV4: unsupported key algorithm ${slot.keyAlg}`);
    }
  };

  /**
   * Wrap the data key to a secp256k1 public key via ECIES — the inverse of
   * unwrapV4EcDataKey, and byte-compatible with go-crypto's EC slot:
   * ephemeral ECDH -> HKDF-SHA256 -> AES-256-GCM.
   * Slot layout: ephPub(65, uncompressed) | nonce(12) | wrappedDataKey||tag(48).
   * @param publicKeyBase64 The recipient's SPKI (or raw uncompressed) secp256k1 public key
   * @param dataKey The payload data key to wrap
   */
  private wrapV4EcDataKey = (publicKeyBase64: string, dataKey: Uint8Array): Uint8Array => {
    const recipient = rawEcPublicKey(this.converter.base64ToUint8Array(publicKeyBase64));

    // Fresh ephemeral scalar per record — reuse would leak the wrapping key across records.
    let ephemeralPrivate = binaryStringToUint8Array(forge.random.getBytesSync(32));
    while (!secp256k1.utils.isValidSecretKey(ephemeralPrivate)) {
      ephemeralPrivate = binaryStringToUint8Array(forge.random.getBytesSync(32));
    }
    const ephemeralPublic = secp256k1.getPublicKey(ephemeralPrivate, false); // uncompressed, 65

    const sharedPoint = secp256k1.getSharedSecret(ephemeralPrivate, recipient); // 33 compressed
    const sharedX = sharedPoint.slice(1, 33);
    const wrappingKey = hkdf(sha256, sharedX, V4_EC_SALT, V4_EC_INFO, 32);

    const nonce = binaryStringToUint8Array(forge.random.getBytesSync(V4_EC_NONCE_LENGTH));
    const wrapped = this.encryptAESGCM(wrappingKey, nonce, dataKey);

    const out = new Uint8Array(ephemeralPublic.length + nonce.length + wrapped.length);
    out.set(ephemeralPublic, 0);
    out.set(nonce, ephemeralPublic.length);
    out.set(wrapped, ephemeralPublic.length + nonce.length);
    return out;
  };

  /**
   * Wrap the data key under a symmetric key with AES-256-GCM — the inverse of
   * unwrapV4RecoveryDataKey. Layout: nonce(12) | wrappedDataKey||tag.
   *
   * This is deliberately the *same* donor recovery key that v3 uses with AES-CBC: one
   * key the donor can keep, usable across formats. Reusing it under two modes is safe
   * here — the modes are never mixed within a record, the key is only ever used to wrap
   * 32-byte data keys, and GCM is an upgrade over v3's unauthenticated CBC. GCM's
   * requirement is nonce uniqueness, which a fresh 96-bit random nonce per wrap gives
   * with an enormous margin at donation volumes (birthday bound ≈ 2^32 wraps per key).
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
    // The header fields are single bytes and slotLen is a uint16, so out-of-range values
    // would wrap silently into a record that decodes as something else. Unreachable with
    // the current registries — checked so it stays that way as they grow.
    if (slots.length > 0xff) {
      throw new Error(`encryptV4: at most 255 slots are supported, got ${slots.length}`);
    }
    for (const slot of slots) {
      if (slot.decrypterId > 0xff || slot.decrypterId < 0) {
        throw new Error(`encryptV4: decrypterId ${slot.decrypterId} does not fit in a byte`);
      }
      if (slot.keyAlg > 0xff || slot.keyAlg < 0) {
        throw new Error(`encryptV4: keyAlg ${slot.keyAlg} does not fit in a byte`);
      }
      if (slot.blob.length > 0xffff) {
        throw new Error(
          `encryptV4: wrapped key of ${slot.blob.length} bytes exceeds the slot limit`
        );
      }
    }

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

  /**
   * Recover the payload data key: walk the record's slots and, for each, try every key
   * whose (decrypterId, keyAlg) match. Same semantics as go-crypto — a slot addressed to
   * another recipient is ignored, and several slots for the same recipient (rotated keys)
   * are all attempted, so an unusable one never masks a usable one.
   * @param slots The record's decoded slots
   * @param keys The caller's keychain
   * @returns The unwrapped 32-byte data key
   */
  private unwrapV4DataKey = (slots: DecodedV4Slot[], keys: V4KeySpec[]): Uint8Array => {
    for (const slot of slots) {
      for (const key of keys) {
        if (key.decrypterId !== slot.decrypterId || key.keyAlg !== slot.keyAlg) {
          continue;
        }
        try {
          return this.unwrapV4Slot(slot, key);
        } catch {
          // Wrong key for this slot (or a corrupt slot): keep looking.
        }
      }
    }
    throw new Error('No v4 slot could be opened with the given keys');
  };

  /** Unwrap one slot with one matching key, dispatching on the key algorithm. */
  private unwrapV4Slot = (slot: DecodedV4Slot, key: V4KeySpec): Uint8Array => {
    switch (key.keyAlg) {
      case V4_KEY_ALG_EC:
        return this.unwrapV4EcDataKey(slot.blob, key.key);
      case V4_KEY_ALG_AES_SYM:
        return this.unwrapV4RecoveryDataKey(slot.blob, key.key);
      case V4_KEY_ALG_RSA_OAEP:
        return this.unwrapV4RsaDataKey(slot.blob, key.key);
      default:
        throw new Error(`Unsupported v4 key algorithm ${key.keyAlg}`);
    }
  };

  /**
   * Unwrap the data key from an RSA-OAEP slot with a PEM private key — the counterpart of
   * v4RsaSlot, for a receiver-side (non-phone) decrypter.
   */
  private unwrapV4RsaDataKey = (slot: Uint8Array, privateKeyPem: string): Uint8Array => {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const dataKey = privateKey.decrypt(uint8ArrayToBinaryString(slot), 'RSA-OAEP', {
      md: forge.md.sha256.create(),
    });
    return binaryStringToUint8Array(dataKey);
  };

  /**
   * Unwrap the data key from an EC slot via ECIES.
   * Slot layout: ephPub(65, uncompressed) | nonce(12) | wrappedDataKey||tag(48).
   */
  private unwrapV4EcDataKey = (ecSlot: Uint8Array, privateKey: string): Uint8Array => {
    const ephemeralPublicKey = ecSlot.slice(0, V4_UNCOMPRESSED_PUBKEY_LENGTH);
    const ecNonce = ecSlot.slice(
      V4_UNCOMPRESSED_PUBKEY_LENGTH,
      V4_UNCOMPRESSED_PUBKEY_LENGTH + V4_EC_NONCE_LENGTH
    );
    const wrappedDataKey = ecSlot.slice(V4_UNCOMPRESSED_PUBKEY_LENGTH + V4_EC_NONCE_LENGTH);

    // ECDH(phonePriv, ephPub) -> X coordinate -> HKDF-SHA256 -> AES-256-GCM key.
    const privateKeyBytes = this.converter.base64ToUint8Array(privateKey);
    const sharedPoint = secp256k1.getSharedSecret(privateKeyBytes, ephemeralPublicKey); // 33-byte compressed
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
    // Errors propagate on purpose: returning a partial result here used to produce a
    // malformed donation buffer further down, turning an encryption failure into
    // undecryptable data instead of a visible error.
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
