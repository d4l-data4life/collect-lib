import { DonorIdentity, ERROR_MESSAGES, Program, ProgramResource } from './types';

export const ALGORITHM = {
  RSA_PSS: {
    name: 'RSA-PSS',
    hash: 'SHA-256',
  },
  RSA_OAEP: { name: 'RSA-OAEP', hash: 'SHA-256' },
  AES_GCM: { name: 'AES-GCM' },
};

export const DONOR_IDENTITY_VERSION = 2;

/**
 * Convert an UTF-8 string into encoded Uint8Array.
 *
 * **Note**: Use this function to convert all strings that are send to an API.
 * @param string The string that needs to be UTF-8 encoded into a Uint8Array
 * @returns The UTF-8 encoded Uint8Array of the input
 */
export const stringToUint8Array = (string: string): Uint8Array => new TextEncoder().encode(string);

export const uint8ArrayToString = (uint8Array: Uint8Array): string =>
  new TextDecoder().decode(uint8Array);

/**
 * Convert a string into a base64 encoded ArrayBuffer
 * @param string The string that needs to be converted into an ArrayBuffer
 * @returns An ArrayBuffer
 */
export const base64StringToArrayBuffer = (string: string): ArrayBuffer => {
  const base64 = window.atob(string);
  const buffer = new ArrayBuffer(base64.length);
  const bufferView = new Uint8Array(buffer);
  for (let i = 0, base64Len = base64.length; i < base64Len; i++) {
    bufferView[i] = base64.charCodeAt(i);
  }
  return buffer;
};

/**
 * Convert a base64 encoded string into Uint8Array
 * @param string The string that needs to be converted into an Uint8Array
 * @returns A Uint8Array
 */
export const base64StringToUint8Array = (string: string): Uint8Array =>
  new Uint8Array(base64StringToArrayBuffer(string));

/**
 * Convert an ArrayBuffer to a Base64 encoded string
 */
export const arrayBufferToBase64 = (arrayBuffer: ArrayBuffer): string =>
  window.btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

/**
 * Convert an ArrayBuffer to a Base64URL
 * @param arrayBuffer The array buffer to convert
 * @returns Base64URL
 */
export const arrayBufferToBase64URL = (arrayBuffer: ArrayBuffer): string =>
  arrayBufferToBase64(arrayBuffer).replace(/\+/g, '-').replace(/\//g, '_');

/**
 * Flatten an array
 * @param array Any array
 */
export const flatten = (array: any[]): any[] =>
  [].concat(...array.map((a) => (Array.isArray(a) ? flatten(a) : a)));

export const getAllowList = (resources: ProgramResource[]): string[] =>
  flatten(
    resources.map((resource: ProgramResource) =>
      resource.versions?.length
        ? resource.versions.map((version) => `${resource.url}|${version}`)
        : [resource.url]
    )
  );

/**
 * Check if the program requires a token to participate
 * @param program The program to check
 * @returns True, if the program requires a token
 */
export const isPrivateProgram = (program: Program): boolean => {
  for (const phase of program.phases) {
    for (const step of phase) {
      if (step.type === 'token') {
        return step.required !== undefined ? step.required : true;
      }
    }
  }
  return false;
};

/**
 * Get the name from a program and compares it against an optional donor identity
 * @param program The program to get the name from
 * @param donorIdentity The donor identity which should match the program name
 * @returns The program name
 */
export const validateProgramName = (program: Program, donorIdentity?: DonorIdentity) => {
  const programName = program.name;
  if (!programName) {
    throw new Error(ERROR_MESSAGES.PROGRAM_NO_STUDY_ID);
  }

  if (donorIdentity && programName !== donorIdentity.scope) {
    throw new Error(ERROR_MESSAGES.STUDY_ID_DOES_NOT_MATCH_DONOR_IDENTITY);
  }
};
