import { AccessTokenProvider } from '../donation/sdk';
import { DonorIdentity } from '../donation/types';
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
  /**
   * The server can no longer collect Garmin data for this donor: the connection is
   * gone or its authorization/token is unusable, and only a fresh authorization by
   * the participant restores it. Buffered items are still delivered alongside this
   * flag, so drain them first, then drop the local Garmin connection so the app
   * offers the "connect Garmin" task again.
   */
  reconnectRequired?: boolean;
  /** Short human-readable cause, for logs and support. */
  reconnectReason?: string;
};

/**
 * Client for the data-collector service. Turns Garmin's webhook-delivered data into a
 * pull feed: the phone connects (handing over its Garmin token + encryption public key),
 * then periodically syncs ECIES-encrypted items it alone can decrypt, and acks them.
 *
 * Every donor endpoint is authenticated with a data-dispatcher-issued donor access token
 * (`Authorization: Bearer <accessToken>`, see DonationSDK.getAccessToken); the collector
 * only verifies the token and never sees the donor's key or the self-sign secret.
 */
export class CollectorClient {
  private accessToken: AccessTokenProvider;
  private baseUrl: string;

  /**
   * @param accessToken Supplies a valid donor access token for each request (typically
   *   `() => donationSDK.getAccessToken(donorIdentity)`, which caches and refreshes it)
   * @param collectorURL Base URL including the API prefix, e.g. https://collect.dev.d4l-dev.de/api/collector/v1
   */
  constructor(accessToken: AccessTokenProvider, collectorURL: string) {
    this.accessToken = accessToken;
    this.baseUrl = collectorURL;
  }

  private authenticatedApi(): Requester {
    return new Requester(this.baseUrl, this.accessToken, true);
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
    const api = this.authenticatedApi();
    const [response] = await api.put<{ status: string; garminUserID: string }>({
      uri: `/connect/${this.studySegment(donorIdentity)}`,
      body: JSON.stringify(params),
    });
    return response;
  }

  /** Pull buffered (encrypted) items with sequence number greater than `since`. */
  async sync(donorIdentity: DonorIdentity, since = 0): Promise<CollectorSyncResponse> {
    const api = this.authenticatedApi();
    const [response] = await api.get<CollectorSyncResponse>({
      uri: `/sync/${this.studySegment(donorIdentity)}?since=${since}`,
    });
    return response;
  }

  /** Acknowledge items up to (and including) `cursor`; the collector prunes them. */
  async ack(donorIdentity: DonorIdentity, cursor: number): Promise<void> {
    const api = this.authenticatedApi();
    await api.post<void>({
      uri: `/sync/${this.studySegment(donorIdentity)}/ack`,
      body: JSON.stringify({ cursor }),
    });
  }

  /** Revoke the Garmin authorization and purge the donor's token + buffer. */
  async disconnect(donorIdentity: DonorIdentity): Promise<void> {
    const api = this.authenticatedApi();
    await api.post<void>({ uri: `/disconnect/${this.studySegment(donorIdentity)}` });
  }
}
