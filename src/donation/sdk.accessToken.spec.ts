import { CryptoModule, WebConverter } from '..';
import { DonationSDK } from './sdk';
import { ERROR_CODES } from './types';

// deriveEncryptionKey is not exercised here, so a stub suffices.
class StubCrypto implements CryptoModule {
  generateKey = (size: number): Uint8Array => new Uint8Array(size);
  deriveEncryptionKey = async (seed: Uint8Array, _salt = 'phoenix'): Promise<Uint8Array> => seed;
}

// Same fixture keypair as hybridEncryption.spec.ts
const donorIdentity = {
  t: 'data-donation' as const,
  keys: {
    priv: '1m2vGqozd9liGPxg4D8Cr9sjV4K2gpwayw90RfMhglc=',
    pub: 'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEars2EMxOJvgpavwGLc/6Xu4xgtOe5QjOcOHJWCLkEQylJDdOZume1tWmHfiNbZNGtqkLdZSjqc1J+EFpdOXSew==',
    rec: 'TjYtXohpnhir+vUlv8UsUFAE+MNdazJb1psp4UZ2mic=',
  },
  v: 2,
  scope: 'demo-bp',
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('DonationSDK access tokens', () => {
  const converter = new WebConverter();
  let fetchMock: jest.Mock;
  let now: number;
  let issued: number;

  const accessTokenCalls = () =>
    fetchMock.mock.calls.filter(([url, init]) => url.endsWith('/access-token') && init?.method === 'POST');

  beforeEach(() => {
    now = 1_760_000_000_000;
    issued = 0;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/token')) {
        return jsonResponse('nonce-token');
      }
      if (url.endsWith('/access-token') && init?.method === 'POST') {
        issued += 1;
        return jsonResponse({ accessToken: `jwt-${issued}`, tokenType: 'Bearer', expiresIn: 300 });
      }
      return new Response('not found', { status: 404 });
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => jest.restoreAllMocks());

  const buildSDK = () =>
    new DonationSDK('self-sign-secret', 'https://donation.example/v2', converter, new StubCrypto());

  describe('requestAccessToken', () => {
    it('POSTs to /access-token with the self-signed donor bearer and returns token + lifetime', async () => {
      const sdk = buildSDK();

      await expect(sdk.requestAccessToken(donorIdentity)).resolves.toEqual({
        accessToken: 'jwt-1',
        expiresIn: 300,
      });

      const [call] = accessTokenCalls();
      const [url, init] = call;
      expect(url).toBe('https://donation.example/v2/access-token');
      expect(init.body).toBeUndefined();
      const bearer = (init.headers as Record<string, string>).Authorization;
      expect(bearer).toMatch(/^Bearer /);
      // Self-signed scheme: base64({messageJSON, signature}), message = {token, donorID}
      const decoded = JSON.parse(Buffer.from(bearer.slice('Bearer '.length), 'base64').toString('utf8'));
      expect(JSON.parse(decoded.messageJSON)).toEqual({
        token: 'nonce-token',
        donorID: donorIdentity.keys.pub,
      });
      expect(typeof decoded.signature).toBe('string');
    });

    it('maps a failed request to INTERNAL_SERVER_ERROR', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      fetchMock.mockImplementation(async (url: string) =>
        url.endsWith('/token') ? jsonResponse('nonce-token') : new Response('nope', { status: 403 })
      );

      await expect(buildSDK().requestAccessToken(donorIdentity)).rejects.toThrow(
        ERROR_CODES.INTERNAL_SERVER_ERROR
      );
    });

    it('rejects a malformed response', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      fetchMock.mockImplementation(async (url: string) =>
        url.endsWith('/token') ? jsonResponse('nonce-token') : jsonResponse({ tokenType: 'Bearer' })
      );

      await expect(buildSDK().requestAccessToken(donorIdentity)).rejects.toThrow(
        ERROR_CODES.INTERNAL_SERVER_ERROR
      );
    });
  });

  describe('getAccessToken', () => {
    it('reuses the token until 30 s before it expires, then fetches a new one', async () => {
      const sdk = buildSDK();

      await expect(sdk.getAccessToken(donorIdentity)).resolves.toBe('jwt-1');
      await expect(sdk.getAccessToken(donorIdentity)).resolves.toBe('jwt-1');
      expect(accessTokenCalls()).toHaveLength(1);

      // Just inside the reuse window: 300 s - 30 s margin, minus a second.
      now += 269 * 1000;
      await expect(sdk.getAccessToken(donorIdentity)).resolves.toBe('jwt-1');
      expect(accessTokenCalls()).toHaveLength(1);

      // Past the margin: refreshed although the token itself is still valid for ~29 s.
      now += 2 * 1000;
      await expect(sdk.getAccessToken(donorIdentity)).resolves.toBe('jwt-2');
      expect(accessTokenCalls()).toHaveLength(2);
    });

    it('lets concurrent callers share one request (single-flight)', async () => {
      const sdk = buildSDK();

      const tokens = await Promise.all([
        sdk.getAccessToken(donorIdentity),
        sdk.getAccessToken(donorIdentity),
        sdk.getAccessToken(donorIdentity),
      ]);

      expect(tokens).toEqual(['jwt-1', 'jwt-1', 'jwt-1']);
      expect(accessTokenCalls()).toHaveLength(1);
    });

    it('caches per donor', async () => {
      const sdk = buildSDK();
      const otherDonor = { ...donorIdentity, keys: { ...donorIdentity.keys, pub: 'other-donor' } };

      await expect(sdk.getAccessToken(donorIdentity)).resolves.toBe('jwt-1');
      await expect(sdk.getAccessToken(otherDonor)).resolves.toBe('jwt-2');
      await expect(sdk.getAccessToken(donorIdentity)).resolves.toBe('jwt-1');
      expect(accessTokenCalls()).toHaveLength(2);
    });

    it('keeps nothing cached after a failure and retries on the next call', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const sdk = buildSDK();
      let fail = true;
      fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
        if (url.endsWith('/token')) {
          return jsonResponse('nonce-token');
        }
        if (url.endsWith('/access-token') && init?.method === 'POST') {
          if (fail) {
            return new Response('unavailable', { status: 503 });
          }
          issued += 1;
          return jsonResponse({
            accessToken: `jwt-${issued}`,
            tokenType: 'Bearer',
            expiresIn: 300,
          });
        }
        return new Response('not found', { status: 404 });
      });

      const failing = [sdk.getAccessToken(donorIdentity), sdk.getAccessToken(donorIdentity)];
      await expect(failing[0]).rejects.toThrow(ERROR_CODES.INTERNAL_SERVER_ERROR);
      await expect(failing[1]).rejects.toThrow(ERROR_CODES.INTERNAL_SERVER_ERROR);
      expect(accessTokenCalls()).toHaveLength(1);

      fail = false;
      await expect(sdk.getAccessToken(donorIdentity)).resolves.toBe('jwt-1');
      expect(accessTokenCalls()).toHaveLength(2);
    });
  });
});
