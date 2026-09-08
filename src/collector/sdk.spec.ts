import { CollectorClient } from './sdk';

const donorIdentity = {
  t: 'data-donation' as const,
  keys: { priv: 'priv', pub: 'donor-pub', rec: 'rec' },
  v: 2,
  scope: 'demo-bp',
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('CollectorClient', () => {
  const collectorURL = 'https://collect.example/api/collector/v1';
  let fetchMock: jest.Mock;
  let accessToken: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn(async () => new Response(null, { status: 204 }));
    global.fetch = fetchMock as unknown as typeof fetch;
    accessToken = jest.fn().mockResolvedValue('dispatcher-jwt');
  });

  const headersOf = (call: number) =>
    fetchMock.mock.calls[call][1].headers as Record<string, string>;

  it('authenticates every donor endpoint with the provided access token as Bearer', async () => {
    const client = new CollectorClient(accessToken, collectorURL);
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 'connected', garminUserID: 'g-1' }));

    const connected = await client.connect(donorIdentity, {
      code: 'c',
      codeVerifier: 'v',
      encPublicKey: 'enc',
      consentDate: '2026-09-01T00:00:00Z',
    });
    expect(connected).toEqual({ status: 'connected', garminUserID: 'g-1' });
    await client.ack(donorIdentity, 7);
    await client.disconnect(donorIdentity);

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      [`${collectorURL}/connect/demo-bp`, 'PUT'],
      [`${collectorURL}/sync/demo-bp/ack`, 'POST'],
      [`${collectorURL}/disconnect/demo-bp`, 'POST'],
    ]);
    for (let i = 0; i < 3; i++) {
      expect(headersOf(i).Authorization).toBe('Bearer dispatcher-jwt');
    }
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ cursor: 7 });
    // The provider decides about caching; the client asks it once per request.
    expect(accessToken).toHaveBeenCalledTimes(3);
  });

  it('syncs with the since cursor and returns the collector payload', async () => {
    const client = new CollectorClient(accessToken, collectorURL);
    const payload = { items: [{ seq: 3, dataType: 'dailies', blob: 'AAA=' }], cursor: 3 };
    fetchMock.mockResolvedValueOnce(jsonResponse(payload));

    await expect(client.sync(donorIdentity, 2)).resolves.toEqual(payload);
    expect(fetchMock.mock.calls[0][0]).toBe(`${collectorURL}/sync/demo-bp?since=2`);
    expect(headersOf(0).Authorization).toBe('Bearer dispatcher-jwt');
  });

  it('retries once with a fresh token from the provider on 401', async () => {
    const client = new CollectorClient(accessToken, collectorURL);
    accessToken.mockResolvedValueOnce('stale-jwt').mockResolvedValueOnce('fresh-jwt');
    fetchMock
      .mockResolvedValueOnce(new Response('expired', { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ items: [], cursor: 0 }));

    await client.sync(donorIdentity);

    expect(headersOf(0).Authorization).toBe('Bearer stale-jwt');
    expect(headersOf(1).Authorization).toBe('Bearer fresh-jwt');
  });

  it('fails without a request when the provider cannot supply a token', async () => {
    const client = new CollectorClient(accessToken, collectorURL);
    accessToken.mockRejectedValue(new Error('not enrolled'));

    await expect(client.sync(donorIdentity)).rejects.toThrow('not enrolled');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses a donor identity without a study scope', async () => {
    const client = new CollectorClient(accessToken, collectorURL);

    const { scope: _scope, ...unscoped } = donorIdentity;

    await expect(client.sync(unscoped)).rejects.toThrow(/no study scope/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
