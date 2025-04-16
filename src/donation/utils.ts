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
