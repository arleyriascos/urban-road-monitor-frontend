import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiUrl } from '../config/env';
import { routeFixture } from '../test/route-fixtures';
import { getRoute } from './routes';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getRoute', () => {
  it('posts the two points and the criterion to /api/routes', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(routeFixture), { status: 200 }));

    const answer = await getRoute({
      origin: { latitude: 1.2136, longitude: -77.2811 },
      destination: { latitude: 1.215, longitude: -77.279 },
      criterion: 'avoid_potholes',
    });

    expect(answer.summary.steps).toBe(3);
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toBe(`${apiUrl}/api/routes`);
    expect(JSON.parse(String(init?.body))).toEqual({
      origin: { latitude: 1.2136, longitude: -77.2811 },
      destination: { latitude: 1.215, longitude: -77.279 },
      criterion: 'avoid_potholes',
    });
  });

  it('passes the cancel signal on', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(routeFixture), { status: 200 }));
    const controller = new AbortController();

    await getRoute(
      { origin: routeFixture.origin, destination: routeFixture.destination, criterion: 'balanced' },
      controller.signal,
    );
    controller.abort();

    expect(fetch.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });
});
