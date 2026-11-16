import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiUrl } from '../config/env';
import type { DetectionPayload } from '../types/trips';
import { closeTrip, sendDetections, startTrip } from './trips';

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

const TOKEN = 't'.repeat(43);
const DETECTION: DetectionPayload = {
  id: '11111111-1111-4111-8111-111111111111',
  latitude: 1.2136,
  longitude: -77.2811,
  gpsAccuracyM: 6.5,
  confidence: 0.82,
  bboxAreaRatio: 0.02,
  detectedAt: '2026-11-16T13:41:12.000Z',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('startTrip', () => {
  it('opens the trip with the device and the model version, signed with the session', async () => {
    const answer = {
      tripId: 'trip-1',
      deviceId: 'device-1',
      startedAt: '2026-11-16T13:30:00.000Z',
      model: { version: '1.0.0', minConfidence: 0.4 },
      limits: { maxGpsAccuracyM: 20, maxBatchSize: 100 },
    };
    const fetchMock = stubFetch(jsonResponse(answer, 201));

    const body = { device: { platform: 'android' as const }, modelVersion: '1.0.0' };
    expect(await startTrip(TOKEN, body)).toEqual(answer);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${apiUrl}/api/trips`);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual(body);
    expect(new Headers(init?.headers).get('Authorization')).toBe(`Bearer ${TOKEN}`);
  });

  it('keeps the expected version when the model of the phone is old', async () => {
    stubFetch(
      jsonResponse(
        {
          error: {
            code: 'MODEL_VERSION_MISMATCH',
            message: 'x',
            details: { expected: '1.1.0', received: '1.0.0' },
          },
        },
        409,
      ),
    );

    await expect(
      startTrip(TOKEN, { device: { platform: 'ios' }, modelVersion: '1.0.0' }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'MODEL_VERSION_MISMATCH',
      details: { expected: '1.1.0' },
    });
  });
});

describe('sendDetections', () => {
  it('posts the batch to the trip it belongs to', async () => {
    const answer = { received: 1, stored: 1, duplicates: 0, rejected: [] };
    const fetchMock = stubFetch(jsonResponse(answer));

    expect(await sendDetections(TOKEN, 'trip-1', [DETECTION])).toEqual(answer);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${apiUrl}/api/trips/trip-1/detections`);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({ detections: [DETECTION] });
  });

  it('puts the trip id safely in the address', async () => {
    const fetchMock = stubFetch(
      jsonResponse({ received: 0, stored: 0, duplicates: 0, rejected: [] }),
    );
    await sendDetections(TOKEN, 'a/b?c', [DETECTION]);
    expect(fetchMock.mock.calls[0][0]).toBe(`${apiUrl}/api/trips/a%2Fb%3Fc/detections`);
  });

  it('fails with the status of a refused batch', async () => {
    stubFetch(jsonResponse({ error: { code: 'TRIP_CLOSED', message: 'x' } }, 409));
    await expect(sendDetections(TOKEN, 't', [DETECTION])).rejects.toMatchObject({
      status: 409,
      code: 'TRIP_CLOSED',
    });
  });
});

describe('closeTrip', () => {
  it('patches the trip with the totals', async () => {
    const fetchMock = stubFetch(jsonResponse({ id: 'trip-1' }));

    await closeTrip(TOKEN, 'trip-1', { framesAnalyzed: 3600, distanceM: 1250.5 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${apiUrl}/api/trips/trip-1`);
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(String(init?.body))).toEqual({ framesAnalyzed: 3600, distanceM: 1250.5 });
  });
});
