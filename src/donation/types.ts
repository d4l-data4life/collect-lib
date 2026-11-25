import { Program } from '../types';

export type DonorIdentity = {
  t: 'data-donation';
  keys: {
    priv: string; // Used to sign auth token (base64 encoded)
    pub: string; // The donor id (used in auth token) (base64 encoded)
    rec: string; // Used to encrypt the randomly generated data key to enable recovery
  };
  v: number;
  scope: string; // The study id
};

export type DonationRecord = {
  id: string;
  document: fhir5.Resource;
  status: RecordState;
};

export type RecordState = 'Active' | 'Deleted';

export type RestorationSize = { totalBytes: number; donations?: { id: string; bytes: number }[] };

export type ResponseMinimal = {
  id: string;
  resourceType: string;
  version: number;
  [key: string]: any;
};

export interface SDKInterface {
  /**
   * Checks readiness state of donation service
   * @returns true if service is available
   */
  donationServiceAvailable: () => Promise<boolean>;
  /**
   * Create a donor identity for a program
   * @param recoveryKey The 16byte long recovery key (from the recovery phrase)
   * @param programName The name of the program
   * @returns A donor identity consisting of a private-public key pair and a recovery key
   */
  createDonorIdentity: (recoveryKey: Uint8Array, programName: string) => Promise<DonorIdentity>;

  /**
   * Register a donor identity for a program
   * @param recoveryKey The 16byte long recovery key (from the recovery phrase)
   * @param program The program for which the registration should be done
   * @param participationCode The optional participation code
   * @returns The newly created donor identity
   */
  register: (
    recoveryKey: Uint8Array,
    program: Program,
    participationCode?: string
  ) => Promise<{ donorIdentity: DonorIdentity; subjectId: string }>;

  /**
   * Donate resources for a study
   * @param donorIdentity The donor identity for the study
   * @param program The program for which the resources should be donated
   * @param records The list of resources that should be donated
   * @returns True, if the donation was successful. Otherwise, false.
   */
  donate: (
    donorIdentity: DonorIdentity,
    program: Program,
    records: { id: string; document: fhir5.Resource; status: RecordState }[]
  ) => Promise<boolean>;

  /**
   * Get the total size of donations which can be restored for a specific program
   * @param donorIdentity The identity of the donor to use
   * @param programName The name of the program to get the size for
   * @returns The total size of the donations and the size of each individual donation that can be restored
   * @throws Error if the donation service is not available or if there is an internal server error
   */
  getRestorationSize(donorIdentity: DonorIdentity, programName: string): Promise<RestorationSize>;

  /**
   * Restore donations based on already made donations
   * @param donorIdentity The donor identity for the study
   * @param programName The name of the program for which the resources should be restored
   * @returns The list of resources that were donated by the given donor identity
   */
  restore: (
    donorIdentity: DonorIdentity,
    programName: string
  ) => Promise<{ document: fhir5.Resource; id: string }[]>;

  /**
   * Revoke all previous donations and do a final donation
   * @param donorIdentity The donor identity to revoke consent for
   * @param programName The name of the program for which the resources should be revoked
   * @param records The final donation. Must include ResearchSubject
   * @returns True, if the revocation was successful. Otherwise, false.
   */
  revoke: (
    donorIdentity: DonorIdentity,
    program: Program,
    records: DonationRecord[] // Under normal circumstances this should only be a ResearchSubject
  ) => Promise<boolean>;

  /**
   * Register device for push notifications
   * @param donorIdentity The donor identity for the study
   * @param program The program for which the device should be registered
   * @param deviceToken The device token for push notifications
   * @returns True, if the registration was successful. Otherwise, false.
   */
  registerDevice: (donorIdentity: DonorIdentity, program: Program, deviceToken: string) => Promise<boolean>;

  /**
   * Unregister device for push notifications
   * @param donorIdentity The donor identity for the study
   * @param program The program for which the device should be unregistered
   * @returns True, if the device was removed successfully. Otherwise, false.
   */
  unregisterDevice: (donorIdentity: DonorIdentity, program: Program) => Promise<boolean>;

  /**
   * Get responses left for participant in a study
   * @param donorIdentity The donor identity for the study
   * @param programName The name of the program for which the responses should be gotten
   * @returns The list of resources that were left for the participant
   */
  getResponses: (donorIdentity: DonorIdentity, programName: string) => Promise<fhir5.Resource[]>;
}

export enum ERROR_CODES {
  COULD_NOT_SIGN = 'could_not_sign',
  PROGRAM_NOT_FOUND = 'program_not_found',
  NO_TARGET_KEY = 'no_target_key',
  COULD_NOT_GET_SERVICE_TOKEN = 'could_not_get_service_token',
  NOT_ONLINE = 'not_online',
  PROGRAM_NO_STUDY_ID = 'program_no_study_id',
  PROGRAM_NO_DONATION = 'program_no_donation',
  MISSING_PARTICIPATION_CODE = 'missing_participation_code',
  DONOR_ALREADY_REGISTERED = 'donor_already_registered',
  DONOR_REGISTRATION_FAILED = 'donor_registration_failed',
  INTERNAL_SERVER_ERROR = 'internal_server_error',
  STUDY_ID_DOES_NOT_MATCH_DONOR_IDENTITY = 'study_id_does_not_match_donor',
  MISSING_RESEARCH_SUBJECT = 'missing_research_subject',
  MISSING_CONSENT = 'missing_consent',
  RESTORE_DECRYPTION_FAILED = 'restore_decryption_failed',
  UPLOAD_PREFERENCES_NOT_MET = 'upload_preferences_not_met',
  UPLOAD_FAILED = 'upload_failed',
}
