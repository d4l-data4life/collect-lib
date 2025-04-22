import { DonorIdentity, ERROR_CODES, Program } from './types';

export const DONOR_IDENTITY_VERSION = 2;

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
export const validateProgramName = (programName: string, donorIdentity?: DonorIdentity) => {
  if (!programName) {
    throw new Error(ERROR_CODES.PROGRAM_NO_STUDY_ID);
  }

  if (donorIdentity && programName !== donorIdentity.scope) {
    throw new Error(ERROR_CODES.STUDY_ID_DOES_NOT_MATCH_DONOR_IDENTITY);
  }
};
