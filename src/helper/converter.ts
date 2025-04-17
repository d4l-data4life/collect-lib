import { Buffer } from 'buffer/';

/**
 * Converter inferface with functions that require some platform specific functions to implement
 * Generally functions requiring either Buffer or Base64 methods provided by polyfills/replacement libs
 */
export interface Converter {
  arrayBufferToBase64: (buffer: ArrayBuffer) => string;
  base64ToArrayBuffer: (string: string) => ArrayBuffer;
  uint8ArrayToBase64: (array: Uint8Array) => string;
  base64ToUint8Array: (string: string) => Uint8Array;
  uint8ArrayToUTF8: (uint: Uint8Array) => string;
  base64ToHex: (base64String: string) => string;
  hexToBase64: (hex: string) => string;
}

// ========================================
// #region Non-Platform dependentUtil Functions
// ========================================

/**
 * Convert a binary string (as returned by forge) to Uint8Array
 * @param binaryString String returned by forge methods
 * @returns The Uint8Array of the input
 */
export const binaryStringToUint8Array = (binaryString: string): Uint8Array => {
  return new Uint8Array(binaryString.split('').map((c) => c.charCodeAt(0)));
};

/**
 * Convert a binary string (as returned by forge) to Uint8Array
 * @param array Uint8Array
 * @returns The binary string representation of the input (as used by forge)
 */
export const uint8ArrayToBinaryString = (array: Uint8Array): string => {
  return String.fromCharCode.apply(null, array as any);
};

/**
 * Convert an UTF-8 string into encoded Uint8Array.
 * @param string The string that needs to be converted
 * @returns The UTF-8 encoded Uint8Array of the input
 */
export const utf8ToUint8Array = (string: string): Uint8Array => {
  const result = [];
  const size = string.length;

  for (let index = 0; index < size; index++) {
    let point = string.charCodeAt(index);

    if (point >= 0xd800 && point <= 0xdbff && size > index + 1) {
      const second = string.charCodeAt(index + 1);

      if (second >= 0xdc00 && second <= 0xdfff) {
        // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        point = (point - 0xd800) * 0x400 + second - 0xdc00 + 0x10000;
        index += 1;
      }
    }

    // US-ASCII
    if (point < 0x80) {
      result.push(point);
      continue;
    }

    // 2-byte UTF-8
    if (point < 0x800) {
      result.push((point >> 6) | 192);
      result.push((point & 63) | 128);
      continue;
    }

    // 3-byte UTF-8
    if (point < 0xd800 || (point >= 0xe000 && point < 0x10000)) {
      result.push((point >> 12) | 224);
      result.push(((point >> 6) & 63) | 128);
      result.push((point & 63) | 128);
      continue;
    }

    // 4-byte UTF-8
    if (point >= 0x10000 && point <= 0x10ffff) {
      result.push((point >> 18) | 240);
      result.push(((point >> 12) & 63) | 128);
      result.push(((point >> 6) & 63) | 128);
      result.push((point & 63) | 128);
      continue;
    }

    // Invalid character
    result.push(0xef, 0xbf, 0xbd);
  }

  return new Uint8Array(result);
};
// #endregion

/**
 * Browser implementation of the Converter interface
 */
export class WebConverter implements Converter {
  arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  base64ToArrayBuffer = (string: string): ArrayBuffer => {
    const base64 = atob(string);
    const buffer = new ArrayBuffer(base64.length);
    const bufferView = new Uint8Array(buffer);
    for (let i = 0, base64Len = base64.length; i < base64Len; i++) {
      bufferView[i] = base64.charCodeAt(i);
    }
    return buffer;
  };

  // convert Uint8Array to base64 string
  uint8ArrayToBase64 = (array: Uint8Array): string => {
    return btoa(String.fromCharCode(...array));
  };

  /**
   * Convert a base64 encoded string into Uint8Array
   * @param string The string that needs to be converted into an Uint8Array
   * @returns A Uint8Array
   */
  base64ToUint8Array = (string: string): Uint8Array =>
    new Uint8Array(this.base64ToArrayBuffer(string));

  /**
   * Convert a base64 encoded Uint8Array into a UTF-8 encoded string
   * @param uint The base64 encoded Uint8Array
   * @returns The UTF-8 encoded string
   */
  uint8ArrayToUTF8 = (uint: Uint8Array): string => {
    const decoder = new TextDecoder();
    const str = decoder.decode(uint);
    return Buffer.from(str, 'base64').toString('utf8');
  };

  base64ToHex = (base64String: string): string =>
    Buffer.from(base64String, 'base64').toString('hex');

  hexToBase64 = (hexString: string): string => Buffer.from(hexString, 'hex').toString('base64');
}
