import { Buffer } from 'buffer/';
import { Converter } from '../helper/converter';
import Requester from '../helper/requester';
import { CryptoModule } from './crypto';
import { filterRecords, includedResearchSubjects } from './document';
import { HybridEncrypter } from './hybridEncryption';
import { KeyHandler } from './keyHandler';
import {
  DonationRecord,
  DonorIdentity,
  ERROR_MESSAGES,
  Program,
  RecordState,
  SDKInterface,
} from './types';
import { DONOR_IDENTITY_VERSION, isPrivateProgram, validateProgramName } from './utils';

// export type GetProgramFn = (programName: string) => Promise<Program>;

export class DonationSDK implements SDKInterface {
  /**
   * Flag indicating if the SDK has been initialized
   */
  private initialized = false;
  private selfSignSecret: string;

  /**
   * Requester targeting the Donation API
   */
  private donationAPI: Requester;
  private keyHandler: KeyHandler;
  private converter: Converter;
  private hybridEncrypter: HybridEncrypter;

  constructor(
    selfSignSecret: string,
    donationAPIurl: string,
    converter: Converter,
    crypto: CryptoModule
  ) {
    this.selfSignSecret = selfSignSecret;
    this.donationAPI = new Requester(donationAPIurl, () => Promise.resolve(''), false);
    this.hybridEncrypter = new HybridEncrypter(converter);
    this.keyHandler = new KeyHandler(converter, crypto);
    this.converter = converter;
    this.initialized = true;
  }

  /**
   * Get the public key for the specified target
   * @param target The target to get the public key for
   * @returns The public key of the donation target
   */
  private async getKeyFor(target: string): Promise<string> {
    try {
      const [response] = await this.donationAPI.get<{ [target: string]: { key: string } }>({
        uri: '/public-keys',
      });
      return response[target].key;
    } catch {
      throw new Error(ERROR_MESSAGES.NO_TARGET_KEY);
    }
  }

  /**
   * Get an authenticated requester for the donation API
   * @param donorIdentity The donor identity
   * @returns An authenticated requester for the donation API
   */
  private async getAuthenticatedDonationAPI(donorIdentity: DonorIdentity): Promise<Requester> {
    // Create function which is used to get an authentication token for the Donation API
    const getDonationApiAuthToken = async () => {
      // Get token from the Donation API
      let token: string;
      try {
        [token] = await this.donationAPI.get<string>({
          uri: `/token`,
        });
      } catch (e) {
        throw new Error(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
      }

      // Create authentication token for Donation API
      const authToken = await this.createAuthToken(
        donorIdentity.keys.pub,
        donorIdentity.keys.priv,
        token,
        this.selfSignSecret
      );

      return authToken;
    };

    // Create authenticated Donation API requester
    return new Requester(this.donationAPI.baseUrl, getDonationApiAuthToken, true);
  }

  /**
   * Create an authentication token which can be used to authenticate with the Donation API
   * @param pub A public base64 encoded key - the donorId
   * @param priv The corresponding base64 encoded private key
   * @param token A unique token issued by the Donation API
   * @param secret SELF_SIGN_SECRET configured for both UA and Donation Service
   * @returns The authentication token that can be used to authenticate with the Donation API
   */
  private createAuthToken = async (
    pub: string,
    priv: string,
    token: string,
    secret: string
  ): Promise<string> => {
    // Message that is used to authenticated the user
    const message = JSON.stringify({
      token,
      donorID: pub,
    });

    // Sign the message
    const signature = await this.keyHandler.sign(message + secret, priv);

    const signedMessage = JSON.stringify({
      messageJSON: message,
      signature: this.converter.uint8ArrayToBase64(signature),
    });

    // Transform the signed message to as base64 string to make is usable as a BEARER token
    return Buffer.from(signedMessage).toString('base64');
  };

  /**
   * Validate an authentication token which can be used to authenticated with the Donation API
   * @param authToken The authentication token that can be used to authenticate with the Donation API
   * @param token A unique token issued by the Donation API
   * @param pub A public base64 encoded key - the donorId
   * @returns True if the authentication token is valid. Otherwise, false.
   */
  private validateAuthToken = async (
    authToken: string,
    token: string,
    pub: string
  ): Promise<boolean> => {
    // Get signature and message
    const { signature, messageJSON: message }: { signature: string; messageJSON: string } =
      JSON.parse(window.atob(authToken));

    // Get the token
    const { token: extractedToken } = JSON.parse(message);

    // Validated the signature and signed message
    const valid = await this.keyHandler.verify(
      message,
      this.converter.base64ToUint8Array(signature),
      pub
    );

    // Validate the token
    return valid && extractedToken === token;
  };

  /**
   * Create a donor identity for a program
   * @param recoveryKey The 16byte long recovery key (from the recovery phrase)
   * @param programName The name of the program
   * @returns A donor identity consisting of a private-public key pair and a recovery key
   */
  async createDonorIdentity(recoveryKey: Uint8Array, programName: string): Promise<DonorIdentity> {
    const keys = await this.keyHandler.deriveProgramKeys(recoveryKey, programName);
    return {
      t: 'data-donation',
      keys: {
        priv: keys.private,
        pub: keys.public,
        rec: keys.recovery,
      },
      v: DONOR_IDENTITY_VERSION,
      scope: programName,
    };
  }

  /**
   * Register a donor identity for a program
   * @param recoveryKey The 16byte long recovery key (from the recovery phrase)
   * @param programName The name of the program for which the registration should be done
   * @param participationCode The optional participation code
   * @returns The newly created donor identity
   */
  async register(
    recoveryKey: Uint8Array,
    program: Program,
    participationCode?: string
  ): Promise<{ donorIdentity: DonorIdentity; subjectId: string }> {
    // Validate the name of the program
    validateProgramName(program.name);

    // Check if program requires a code
    if (isPrivateProgram(program) && !participationCode) {
      throw new Error(ERROR_MESSAGES.MISSING_PARTICIPATION_CODE);
    }

    // Create and register donor identity
    // try {
    // Create donor identity
    const donorIdentity = await this.createDonorIdentity(recoveryKey, program.name);
    const [subjectId] = await this.donationAPI.put<string>({
      uri: '/register',
      body: JSON.stringify({
        programName: program.name,
        donorID: donorIdentity.keys.pub,
        ...(participationCode && { participantCode: participationCode }),
      }),
    });
    return { donorIdentity, subjectId };
    // } catch (error: any) {
    //   console.error(new Error(`[Donation Service] ${error}`));
    //   switch (error.status) {
    //     case 409:
    //       throw new Error(ERROR_MESSAGES.DONOR_ALREADY_REGISTERED); // The donor identity is already registered using a different participation code
    //     case 500:
    //       throw new Error(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    //     default:
    //       throw new Error(ERROR_MESSAGES.DONOR_REGISTRATION_FAILED); // Participation code doesn't exist
    //   }
    // }
  }

  async donate(
    donorIdentity: DonorIdentity,
    program: Program,
    records: DonationRecord[]
  ): Promise<boolean> {
    ////////
    // Check prerequisites
    ////////
    if (!this.initialized) {
      throw new Error(ERROR_MESSAGES.SDK_NOT_INITIALIZED);
    }

    if (!records || !records.length) {
      throw new Error(ERROR_MESSAGES.NOT_ENOUGH_DOCUMENTS);
    }

    // Validate the name of the program
    validateProgramName(program.name, donorIdentity);

    // Filter out every document that does not fit the requirements and blur the remaining ones
    let donatableRecords: DonationRecord[] = filterRecords(records, program.name, program.donation);

    // Check if the documents suffice for a donation
    if (!donatableRecords.length) {
      return true;
    }

    ////////
    // Encrypt documents
    ////////

    const donations = await this.encryptDonations(
      donatableRecords,
      donorIdentity,
      program.donation.target
    );

    ////////
    // Donate
    ////////

    // Create authenticated Donation API requester
    let authenticatedDonationAPI = await this.getAuthenticatedDonationAPI(donorIdentity);

    // Upload donations
    try {
      await authenticatedDonationAPI.put<void>({
        uri: `/donations/${program.name}`,
        body: JSON.stringify(donations),
      });
    } catch (e) {
      console.error(e);
      throw new Error(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }

    return true;
  }

  /**
   * Encrypt donations to be donated to a specific target
   * @param donatableRecords The donations to encrypt
   * @param donorIdentity The identity of the donor to use
   * @param target The donation target
   * @returns The list of encrypted donations
   */
  private async encryptDonations(
    donatableRecords: DonationRecord[],
    donorIdentity: DonorIdentity,
    target: string
  ): Promise<{ id: string; data: string }[]> {
    const key = await this.getKeyFor(target);
    return donatableRecords.map((donatableRecord) => {
      const { id, document, status } = donatableRecord;
      const encryptedDocument = this.hybridEncrypter.encrypt(
        donorIdentity.keys.rec,
        status === RecordState.DELETED ? '' : JSON.stringify(document),
        key
      );
      return {
        id,
        data: encryptedDocument,
      };
    });
  }

  async restore(
    donorIdentity: DonorIdentity,
    programName: string
  ): Promise<{ document: fhir5.Resource; id: string; status: RecordState }[]> {
    ////////
    // Check prerequisites
    ////////
    if (!this.initialized) {
      throw new Error(ERROR_MESSAGES.SDK_NOT_INITIALIZED);
    }

    // Validate the name of the program
    validateProgramName(programName, donorIdentity);

    ////////
    // Retrieve donations
    ////////

    // Create authenticated Donation API requester
    let authenticatedDonationAPI = await this.getAuthenticatedDonationAPI(donorIdentity);

    // Retrieve donation
    let donations: {
      id: string;
      data: string;
    }[] = [];
    try {
      let limit = 100;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const [response, _] = await authenticatedDonationAPI.get<{
          donations: { id: string; data: string }[];
          limit: number;
          offset: number;
        }>({
          uri: `/donations/${programName}?limit=${limit}&offset=${offset}`,
        });

        limit = response.limit;
        donations = [...donations, ...response.donations];
        hasMore = response.donations.length >= limit;
        offset += limit;
      }
    } catch (e) {
      throw new Error(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }

    ////////
    // Decrypt donations
    ////////

    let documents: {
      document: any;
      id: string;
      status: RecordState;
    }[] = [];
    try {
      // Decrypt donations
      documents = donations
        .map(({ id, data }) => ({
          id,
          data: this.hybridEncrypter.decrypt(donorIdentity.keys.rec, data),
        }))
        .filter(({ data }) => data !== '')
        .map(({ id, data }) => {
          return {
            document: JSON.parse(data),
            id,
            status: RecordState.ACTIVE,
          };
        });
    } catch {
      throw new Error(ERROR_MESSAGES.RESTORE_DECRYPTION_FAILED);
    }

    return documents;
  }

  async revoke(
    donorIdentity: DonorIdentity,
    program: Program,
    records: DonationRecord[] // Under normal circumstances this should only be a ResearchSubject
  ): Promise<boolean> {
    ////////
    // Check prerequisites
    ////////
    if (!this.initialized) {
      throw new Error(ERROR_MESSAGES.SDK_NOT_INITIALIZED);
    }

    if (!records || !records.length) {
      throw new Error(ERROR_MESSAGES.NOT_ENOUGH_DOCUMENTS);
    }

    // Validate the name of the program with the donorIdentity
    validateProgramName(program.name, donorIdentity);

    // Filter out every document that does not fit the requirements and blur the remaining ones
    const donatableRecords: DonationRecord[] = filterRecords(
      records,
      program.name,
      program.donation
    );

    if (includedResearchSubjects(donatableRecords).length < 1) {
      throw new Error(ERROR_MESSAGES.MISSING_RESEARCH_SUBJECT);
    }

    ////////
    // Encrypt documents
    ////////

    const donations = await this.encryptDonations(
      donatableRecords,
      donorIdentity,
      program.donation.target
    );

    ////////
    // Revoke
    ////////

    // Create authenticated Donation API requester
    let authenticatedDonationAPI = await this.getAuthenticatedDonationAPI(donorIdentity);

    // Upload donations
    try {
      await authenticatedDonationAPI.put<void>({
        uri: `/revoke/${program.name}`,
        body: JSON.stringify(donations),
      });
    } catch (e) {
      throw new Error(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }

    return true;
  }
}
