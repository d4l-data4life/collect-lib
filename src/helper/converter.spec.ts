import {
  binaryStringToUint8Array,
  uint8ArrayToBinaryString,
  utf8ToUint8Array,
  WebConverter,
} from './converter';

describe('Platform-independent', () => {
  describe('binaryStringToUint8Array / uint8ArrayToBinaryString', () => {
    it('should convert a binary string to Uint8Array and back', () => {
      const binaryString = '\x00\x01\x7F\x80\xFF';
      const arr = binaryStringToUint8Array(binaryString);
      expect(arr).toEqual(new Uint8Array([0, 1, 127, 128, 255]));
      const str = uint8ArrayToBinaryString(arr);
      expect(str).toBe(binaryString);
    });

    it('should handle empty string', () => {
      const arr = binaryStringToUint8Array('');
      expect(arr).toEqual(new Uint8Array([]));
      const str = uint8ArrayToBinaryString(arr);
      expect(str).toBe('');
    });
  });

  describe('utf8ToUint8Array', () => {
    it('should encode ASCII correctly', () => {
      const input = 'Hello!';
      const arr = utf8ToUint8Array(input);
      expect(Array.from(arr)).toEqual([72, 101, 108, 108, 111, 33]);
    });

    it('should encode extended characters (umlauts, emoji)', () => {
      const input = 'äöü 🌍';
      const arr = utf8ToUint8Array(input);
      // decode back to string for round-trip check
      const decoder = new TextDecoder();
      expect(decoder.decode(arr)).toBe(input);
    });

    it('should handle surrogate pairs (emoji)', () => {
      const input = '😀';
      const arr = utf8ToUint8Array(input);
      const decoder = new TextDecoder();
      expect(decoder.decode(arr)).toBe(input);
    });

    it('should encode empty string as empty Uint8Array', () => {
      const arr = utf8ToUint8Array('');
      expect(arr).toEqual(new Uint8Array([]));
    });
  });
});

describe('WebConverter', () => {
  const converter = new WebConverter();

  describe('arrayBufferToBase64/base64ToArrayBuffer', () => {
    it('returns the original array buffer after encode and decode', () => {
      const input = new Uint8Array([0, 1, 2, 127, 128, 254, 255]).buffer;

      const encoded = converter.arrayBufferToBase64(input);
      const decoded = converter.base64ToArrayBuffer(encoded);

      expect(new Uint8Array(decoded)).toEqual(new Uint8Array(input));
    });

    it('returns the original base64 after decode and encode', () => {
      const base64 = 'AAECf4D+/w==';

      const decoded = converter.base64ToArrayBuffer(base64);
      const encoded = converter.arrayBufferToBase64(decoded);

      expect(encoded).toBe(base64);
    });
  });

  describe('uint8ArrayToBase64/base64ToUint8Array', () => {
    it('returns the original Uint8Array after encode and decode', () => {
      const input = new Uint8Array([10, 20, 30, 40, 50, 60, 255]);

      const encoded = converter.uint8ArrayToBase64(input);
      const decoded = converter.base64ToUint8Array(encoded);

      expect(decoded).toEqual(input);
    });

    it('returns the original base64 after decode and encode', () => {
      const base64 = 'ChQeKDI8/w==';

      const decoded = converter.base64ToUint8Array(base64);
      const encoded = converter.uint8ArrayToBase64(decoded);

      expect(encoded).toBe(base64);
    });
  });

  describe('base64ToHex/hexToBase64', () => {
    it('returns the original base64 after converting to hex and back', () => {
      const base64 = 'SGVsbG8gV29ybGQh';

      const hex = converter.base64ToHex(base64);
      const result = converter.hexToBase64(hex);

      expect(result).toBe(base64);
    });

    it('returns the original hex after converting to base64 and back', () => {
      const hex = '48656c6c6f20576f726c6421';

      const base64 = converter.hexToBase64(hex);
      const result = converter.base64ToHex(base64);

      expect(result).toBe(hex);
    });
  });

  describe('uint8ArrayToUTF8', () => {
    it('returns the original UTF-8 string when run with its opposite preparation', () => {
      const input = 'Hello, world! äöü 🌍';

      const utf8AsBase64 = Buffer.from(input, 'utf8').toString('base64');
      const preparedInput = utf8ToUint8Array(utf8AsBase64);
      const result = converter.uint8ArrayToUTF8(preparedInput);

      expect(result).toBe(input);
    });
  });
});
