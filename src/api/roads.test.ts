import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiUrl } from '../config/env';
import { getSegmentSummary, searchStreets } from './roads';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function stubFetch(result: Response) {
  const fetchMock = vi.fn<typeof fetch>(async () => result);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('getSegmentSummary', () => {
  it('asks for the summary of the segment without a session', async () => {
    const answer = { segment: { id: 5 }, radius: 2, window: {}, road: {} };
    const fetchMock = stubFetch(jsonResponse(answer));

    expect(await getSegmentSummary(5)).toEqual(answer);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${apiUrl}/api/road-segments/5/summary`);
    expect(init?.method).toBe('GET');
    expect(new Headers(init?.headers).has('Authorization')).toBe(false);
  });

  it('sends the radius when it is given', async () => {
    const fetchMock = stubFetch(jsonResponse({}));
    await getSegmentSummary(5, { radius: 3 });
    expect(fetchMock.mock.calls[0][0]).toBe(`${apiUrl}/api/road-segments/5/summary?radius=3`);
  });

  it('fails with the code of a segment that does not exist', async () => {
    stubFetch(jsonResponse({ error: { code: 'SEGMENT_NOT_FOUND', message: 'x' } }, 404));
    await expect(getSegmentSummary(999)).rejects.toMatchObject({
      status: 404,
      code: 'SEGMENT_NOT_FOUND',
    });
  });
});

describe('searchStreets', () => {
  it('sends what was typed, safely written in the address', async () => {
    const answer = { query: 'avenida pastó & co', streets: [] };
    const fetchMock = stubFetch(jsonResponse(answer));

    expect(await searchStreets('avenida pastó & co')).toEqual(answer);

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${apiUrl}/api/roads/search?q=avenida+past%C3%B3+%26+co`,
    );
  });

  it('sends the limit when it is given', async () => {
    const fetchMock = stubFetch(jsonResponse({ query: 'c', streets: [] }));
    await searchStreets('c', { limit: 5 });
    expect(fetchMock.mock.calls[0][0]).toBe(`${apiUrl}/api/roads/search?q=c&limit=5`);
  });

  it('fails with the status of a refused search', async () => {
    stubFetch(jsonResponse({ error: { code: 'TOO_MANY_REQUESTS', message: 'x' } }, 429));
    await expect(searchStreets('c')).rejects.toMatchObject({ status: 429 });
  });
});
