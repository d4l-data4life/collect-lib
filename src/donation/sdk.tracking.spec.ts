import { DonationSDK } from './sdk';
import { HybridEncrypter } from './hybridEncryption';
import { CryptoModule, WebConverter } from '..';
import { TRACKING_RESOURCE_TYPE, TrackingEventsDocument } from '../tracking/types';
import { Program } from '../types';
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

const testKey =
  '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAo/RjFKPLbcahfXM/Nbnf\n91v3IR5l3roM7CAZXPdYt3PsCE4uTlumYOjQsRcCKbzk4GQCi4MDRszKai3bMQZK\nqmhJ8nRHq5d4Q0bvh+g5e9YDCvoqDI/C1KvXAfnKwxUM7QmIwJGAV3H7ZlYizX85\nExaIhNM67RMCBi5ntKNdM1GIEFYWRKFlU2ghZbGlEw9VBbjXDzZWuPWCrWUHK5tt\n6kcpdP8tyYV0L2mLXpM+2ZUPBETIufF5yEM41Iz6aPPh2FO26+zIuszmWtR9AxVo\nwjK87mgmL4Aqt+aEOGsGKq42RCoRE9SiPYGUtbXlKj9hpXTwZipqM5aQP0iku0i/\noQIDAQAB\n-----END PUBLIC KEY-----\n';

const program = {
  name: 'demo-bp',
  donation: { target: 'DATAREC', delay: 0, revocation: 'delete' },
} as Program;

const batchId = '01890a5d-ac96-774b-bcce-b302099a8057';

const document: TrackingEventsDocument = {
  resourceType: TRACKING_RESOURCE_TYPE,
  studyId: 'demo-bp',
  subjectId: 'subject-1',
  appVersion: '3.14.0',
  os: 'iOS',
  events: [
    {
      id: '01J5W9Z3N0X6K8YQ2B4C7D9E1F',
      name: 'app_started',
      category: 'technical',
      timestamp: '2026-08-26T09:12:33.120Z',
      properties: { version: '3.14.0' },
    },
  ],
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('DonationSDK.donateTrackingEvents', () => {
  const converter = new WebConverter();
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/public-keys')) {
        return jsonResponse({ DATAREC: { key: testKey } });
      }
      if (url.endsWith('/token')) {
        return jsonResponse('nonce-token');
      }
      if (url.includes('/tracking/') && init?.method === 'PUT') {
        return new Response(null, { status: 204 });
      }
      return new Response('not found', { status: 404 });
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  const buildSDK = () =>
    new DonationSDK('self-sign-secret', 'https://donation.example/v2', converter, new StubCrypto());

  it('PUTs one encrypted batch to /tracking/{program} that round-trips to the document', async () => {
    const sdk = buildSDK();
    const result = await sdk.donateTrackingEvents(donorIdentity, program, document, batchId);
    expect(result).toBe(true);

    const putCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT');
    expect(putCall).toBeDefined();
    const [url, init] = putCall!;
    expect(url).toBe('https://donation.example/v2/tracking/demo-bp');
    expect((init.headers as Record<string, string>).Authorization).toMatch(/^Bearer /);

    const donations: { id: string; data: string }[] = JSON.parse(init.body);
    expect(donations).toHaveLength(1);
    expect(donations[0].id).toBe(batchId);

    const decrypted = new HybridEncrypter(converter).decrypt(
      donorIdentity.keys.rec,
      donations[0].data
    );
    expect(JSON.parse(decrypted)).toEqual(document);
  });

  it('rejects a program that does not match the donor identity', async () => {
    const sdk = buildSDK();
    const foreignProgram = { ...program, name: 'other-study' } as Program;
    await expect(
      sdk.donateTrackingEvents(donorIdentity, foreignProgram, document, batchId)
    ).rejects.toThrow(ERROR_CODES.STUDY_ID_DOES_NOT_MATCH_DONOR_IDENTITY);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips the upload entirely for an empty batch', async () => {
    const sdk = buildSDK();
    const result = await sdk.donateTrackingEvents(
      donorIdentity,
      program,
      { ...document, events: [] },
      batchId
    );
    expect(result).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
