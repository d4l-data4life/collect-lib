import { Buffer } from 'buffer/';
import { CryptoModule } from '../donation/crypto';
import { KeyHandler } from '../donation/keyHandler';
import { DonorIdentity } from '../donation/types';
import { Converter } from '../helper/converter';
import Requester from '../helper/requester';

export type CollectorConnectParams = {
  /**
   * OAuth authorization code captured by the app at the HTTPS redirect
   * (Universal/App Links). The collector exchanges it server-side — the client
   * secret and the resulting Garmin token never reach the phone.
   */
  code: string;
  /** PKCE code verifier matching the authorize request. */
  codeVerifier: string;
  /** The phone's derived encryption public key (SPKI, base64) — see KeyHandler.deriveEncryptionKeypair. */
  encPublicKey: string;
  /** Consent date (RFC3339); anchors backfill and is the lower bound for stored data. */
  consentDate: string;
};

/** One opaque, phone-decryptable item from the collector buffer (blob is a base64 v4 ciphertext). */
export type CollectorSyncItem = {
  seq: number;
  dataType: string;
  blob: string;
};

export type CollectorSyncResponse = {
  items: CollectorSyncItem[];
  cursor: number;
};

/**
 * Build the self-signed donor bearer token used to authenticate with the collector
 * (identical scheme to the data-dispatcher / DonationSDK): sign `message + secret` with
 * the program private key, where `message` embeds the collector-issued token + the donorID.
 */
export const buildSelfSignedAuthToken = async (
  keyHandler: KeyHandler,
  converter: Converter,
  pub: string,
  priv: string,
  token: string,
  selfSignSecret: string
): Promise<string> => {
  const message = JSON.stringify({ token, donorID: pub });
  const signature = await keyHandler.sign(message + selfSignSecret, priv);
  const signedMessage = JSON.stringify({
    messageJSON: message,
    signature: converter.uint8ArrayToBase64(signature),
  });
  return Buffer.from(signedMessage).toString('base64');
};

/**
 * Client for the data-collector service. Turns Garmin's webhook-delivered data into a
 * pull feed: the phone connects (handing over its Garmin token + encryption public key),
 * then periodically syncs ECIES-encrypted items it alone can decrypt, and acks them.
 */
export class CollectorClient {
  private selfSignSecret: string;
  private api: Requester;
  private keyHandler: KeyHandler;
  private converter: Converter;

  /**
   * @param selfSignSecret SELF_SIGN_SECRET shared with the collector (and the dispatcher)
   * @param collectorURL Base URL including the API prefix, e.g. https://collect.dev.d4l-dev.de/api/collector/v1
   */
  constructor(
    selfSignSecret: string,
    collectorURL: string,
    converter: Converter,
    crypto: CryptoModule
  ) {
    this.selfSignSecret = selfSignSecret;
    this.api = new Requester(collectorURL, () => Promise.resolve(''), false);
    this.keyHandler = new KeyHandler(converter, crypto);
    this.converter = converter;
  }

  private async authenticatedApi(donorIdentity: DonorIdentity): Promise<Requester> {
    const getAuthToken = async () => {
      const [token] = await this.api.get<string>({ uri: '/token' });
      return buildSelfSignedAuthToken(
        this.keyHandler,
        this.converter,
        donorIdentity.keys.pub,
        donorIdentity.keys.priv,
        token,
        this.selfSignSecret
      );
    };
    return new Requester(this.api.baseUrl, getAuthToken, true);
  }

  /**
   * The collector's donor endpoints are study-scoped in the URL (mirroring the
   * data-dispatcher); the study id is the identity's scope (the program name).
   */
  private studySegment(donorIdentity: DonorIdentity): string {
    if (!donorIdentity.scope) {
      throw new Error('donor identity has no study scope; cannot address the collector');
    }
    return encodeURIComponent(donorIdentity.scope);
  }

  /** Register the donor's Garmin connection and start ingestion. */
  async connect(
    donorIdentity: DonorIdentity,
    params: CollectorConnectParams
  ): Promise<{ status: string; garminUserID: string }> {
    const api = await this.authenticatedApi(donorIdentity);
    const [response] = await api.put<{ status: string; garminUserID: string }>({
      uri: `/connect/${this.studySegment(donorIdentity)}`,
      body: JSON.stringify(params),
    });
    return response;
  }

  /** Pull buffered (encrypted) items with sequence number greater than `since`. */
  async sync(donorIdentity: DonorIdentity, since = 0): Promise<CollectorSyncResponse> {
    const api = await this.authenticatedApi(donorIdentity);
    const [response] = await api.get<CollectorSyncResponse>({
      uri: `/sync/${this.studySegment(donorIdentity)}?since=${since}`,
    });
    return response;
  }

  /** Acknowledge items up to (and including) `cursor`; the collector prunes them. */
  async ack(donorIdentity: DonorIdentity, cursor: number): Promise<void> {
    const api = await this.authenticatedApi(donorIdentity);
    await api.post<void>({
      uri: `/sync/${this.studySegment(donorIdentity)}/ack`,
      body: JSON.stringify({ cursor }),
    });
  }

  /** Revoke the Garmin authorization and purge the donor's token + buffer. */
  async disconnect(donorIdentity: DonorIdentity): Promise<void> {
    const api = await this.authenticatedApi(donorIdentity);
    await api.post<void>({ uri: `/disconnect/${this.studySegment(donorIdentity)}` });
  }
}
