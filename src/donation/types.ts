export enum KEYTYPES {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC',
}

export enum USAGE {
  ENCRYPT = 'encrypt',
  DECRYPT = 'decrypt',
  SIGN = 'sign',
  VERIFY = 'verify',
  DERIVE_BITS = 'deriveBits',
}

export type KeyPair = {
  private: string;
  public: string;
};

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

export type SignConsentRequest = {
  consentDocumentKey: string;
  studyID: string;
  signatureType: SIGNATURE_TYPES;
  payload: string;
};

export enum SIGNATURE_TYPES {
  REGISTER = 'consentOnce',
  DONATE = 'normalUse',
}

export enum REVOCATION_TYPES {
  DELETE = 'delete',
}

export type SignedConsent = {
  consentMessageJSON: string;
  signature: string;
};

export type RevocationMessage = {
  donorId: string;
  consentDocumentKey: string;
  studyID: string;
  revocationType: string;
  uuid: string;
};

export type DonationRecord = {
  id: string;
  document: fhir5.Resource;
  status: RecordState;
};

export type ProgramType = 'study' | 'diary' | 'sensor';

export type Program = {
  name: string;
  tenantID: string;
  languages: string[];
  type: ProgramType;
  donation: ProgramDonation;
  endDate?: string;
  phases: ProgramStep[][];
};

export type ProgramDonation = {
  consentKey?: string;
  delay: number;
  revocation: 'delete' | 'anonymize';
  anonymization?: ProgramAnonymization;
  target: string;
};

export type ProgramStepType = 'consent' | 'token' | 'survey' | 'wearable' | 'display';

export type ProgramStep = {
  type: ProgramStepType;
  required: boolean;
};

export type ProgramResource = {
  url: string;
  versions?: string[];
  blur?: {
    location?: string;
    authored?: DateBlurringFunction;
    items?: ItemBlurring[];
  };
};

export type ProgramAnonymization = {
  blur?: {
    location: string;
    authored?: DateBlurringFunction;
    researchSubject?: DateBlurringFunction;
  };
};

export type DateBlurringFunction =
  | 'startOfDay'
  | 'endOfDay'
  | 'startOfWeek'
  | 'endOfWeek'
  | 'startOfMonth'
  | 'endOfMonth';

export type NumberBlurringFunction = 'groupBy';

export type NumberBlurringParams = 'lowerBoundaries' | 'intervalSize';

export type ItemBlurring = {
  linkId: string;
  fn: DateBlurringFunction | NumberBlurringFunction;
  params?: { [key in NumberBlurringParams]?: number | number[] };
};

export interface RequesterHeaders {
  [key: string]: string;
}

export interface RequesterArguments {
  uri: string;
  authenticated?: boolean;
  retry?: boolean;
  method?: string;
  contentType?: string;
  sendLanguage?: boolean;
  headers?: RequesterHeaders;
  body?: any;
  credentials?: 'omit' | 'same-origin' | 'include';
}

export interface RequesterInterface {
  accessToken: Promise<string>;
  requestAccessToken: () => Promise<string>;
  resetAccessToken: () => void;
  get: <T = unknown>(params: Omit<RequesterArguments, 'method'>) => Promise<[T, Headers]>;
  post: <T = unknown>(params: Omit<RequesterArguments, 'method'>) => Promise<[T, Headers]>;
  put: <T = unknown>(params: Omit<RequesterArguments, 'method'>) => Promise<[T, Headers]>;
  del: <T = unknown>(params: Omit<RequesterArguments, 'method'>) => Promise<[T, Headers]>;
  request: <T = unknown>(args: RequesterArguments) => Promise<[T, Headers]>;
}

export interface SDKInterface {
  /**
   * Create a donor identity for a study
   * @param masterKeyEntropy The entropy of the master key
   * @param studyId The id of the study
   * @returns A donor identity consisting of a private-public key pair and a data encryption key
   */
  createDonorIdentity: (recoveryKey: Uint8Array, programName: string) => Promise<DonorIdentity>;

  /**
   * Register a donor identity for a program
   * @param recoveryKey The 16byte long recovery key (from the recovery phrase)
   * @param programName The name of the program for which the registration should be done
   * @param participationCode The optional participation code
   * @returns The newly created donor identity
   */
  register: (
    recoveryKey: Uint8Array,
    programName: string,
    participationCode?: string
  ) => Promise<{ donorIdentity: DonorIdentity; subjectId: string }>;

  /**
   * Donate resources for a study
   * @param donorIdentity The donor identity for the study
   * @param programName The name of the program for which the resources should be donated
   * @param records The list of resources that should be donated
   * @returns True, if the donation was successful. Otherwise, false.
   */
  donate: (
    donorIdentity: DonorIdentity,
    programName: string,
    records: { id: string; document: fhir5.Resource; status: RecordState }[]
  ) => Promise<boolean>;

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
    programName: string,
    records: { id: string; document: fhir5.Resource; status: RecordState }[] // Under normal circumstances this should only be a ResearchSubject
  ) => Promise<boolean>;
}

export enum ERROR_MESSAGES {
  SDK_NOT_INITIALIZED = 'SDK_NOT_INITIALIZED',
  NOT_ENOUGH_DOCUMENTS = 'NOT_ENOUGH_DOCUMENTS',
  COULD_NOT_IMPORT_KEYS = 'COULD_NOT_IMPORT_KEYS',
  COULD_NOT_SIGN = 'COULD_NOT_SIGN',
  COULD_NOT_VERIFY = 'COULD_NOT_VERIFY',
  STUDY_ID_DOESNT_MATCH_DONOR_IDENTITY = 'STUDY_ID_DOESNT_MATCH_DONOR_IDENTITY',
  MISSING_TOKEN = 'MISSING_TOKEN',
  // old ones above, new below
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

export enum RecordState {
  ACTIVE = 'Active',
  DELETED = 'Deleted',
}
