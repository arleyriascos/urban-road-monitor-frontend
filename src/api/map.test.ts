import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiUrl } from '../config/env';
import { potholesFixture, segmentsFixture, statsFixture } from '../test/fixtures';
import { ApiError } from './http';
import { getNetworkStats, getPotholes, getRoadSegments } from './map';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function stubFetch(result: Response | Error) {
  const fetchMock = vi.fn<typeof fetch>(async () => {
    if (result instanceof Error) throw result;
    return result;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('map API client', () => {
  it('loads the road segments', async () => {
    const fetchMock = stubFetch(jsonResponse(segmentsFixture));
    expect(await getRoadSegments()).toEqual(segmentsFixture);
    expect(fetchMock.mock.calls[0][0]).toBe(`${apiUrl}/api/road-segments`);
  });

  it('loads the potholes without the repaired ones by default', async () => {
    const fetchMock = stubFetch(jsonResponse(potholesFixture));
    expect(await getPotholes({ includeRepaired: false })).toEqual(potholesFixture);
    expect(fetchMock.mock.calls[0][0]).toBe(`${apiUrl}/api/potholes`);
  });

  it('asks for the repaired potholes when requested', async () => {
    const fetchMock = stubFetch(jsonResponse(potholesFixture));
    await getPotholes({ includeRepaired: true });
    expect(fetchMock.mock.calls[0][0]).toBe(`${apiUrl}/api/potholes?includeRepaired=true`);
  });

  it('loads the network stats', async () => {
    const fetchMock = stubFetch(jsonResponse(statsFixture));
    expect(await getNetworkStats()).toEqual(statsFixture);
    expect(fetchMock.mock.calls[0][0]).toBe(`${apiUrl}/api/road-network/stats`);
  });

  it('turns an error answer of the backend into an ApiError with its code', async () => {
    stubFetch(
      jsonResponse({ error: { code: 'INVALID_QUERY', message: 'Consulta inválida' } }, 400),
    );
    const error = await getPotholes({ includeRepaired: false }).catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      kind: 'http',
      status: 400,
      code: 'INVALID_QUERY',
      message: 'Consulta inválida',
    });
  });

  it('turns a network failure into an ApiError of kind network', async () => {
    stubFetch(new TypeError('fetch failed'));
    const error = await getRoadSegments().catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: 'network' });
  });
});
