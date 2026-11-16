import { describe, expect, it } from 'vitest';
import {
  backoffDelayMs,
  BASE_DELAY_MS,
  classifySendError,
  MAX_DELAY_MS,
  retryDelayMs,
} from './errors';

const http = (status: number, code?: string, details?: Record<string, unknown>) => ({
  kind: 'http' as const,
  status,
  code,
  details,
});

describe('classifySendError', () => {
  it('retries when there is no connection or the server is slow', () => {
    expect(classifySendError({ kind: 'network' })).toEqual({ action: 'retry', waitS: null });
    expect(classifySendError({ kind: 'timeout' })).toEqual({ action: 'retry', waitS: null });
  });

  it('ends the session on 401, and keeps the queue', () => {
    expect(classifySendError(http(401, 'UNAUTHORIZED'))).toEqual({ action: 'session_over' });
  });

  it('stops on 403 because the account may not send', () => {
    expect(classifySendError(http(403, 'FORBIDDEN'))).toEqual({ action: 'not_allowed' });
  });

  it('opens a new trip when the trip is closed or unknown', () => {
    expect(classifySendError(http(409, 'TRIP_CLOSED'))).toEqual({ action: 'new_trip' });
    expect(classifySendError(http(404, 'TRIP_NOT_FOUND'))).toEqual({ action: 'new_trip' });
  });

  it('waits for an update when the model of the phone is old', () => {
    expect(classifySendError(http(409, 'MODEL_VERSION_MISMATCH'))).toEqual({
      action: 'model_outdated',
    });
  });

  it('drops a batch the server calls invalid', () => {
    expect(classifySendError(http(400, 'INVALID_REQUEST'))).toEqual({ action: 'drop_batch' });
  });

  it('retries a 429 after what the server asks', () => {
    expect(classifySendError(http(429, 'TOO_MANY_REQUESTS', { retryAfterS: 30 }))).toEqual({
      action: 'retry',
      waitS: 30,
    });
    expect(classifySendError(http(429))).toEqual({ action: 'retry', waitS: null });
  });

  it('retries a 503, which never means the session died', () => {
    expect(classifySendError(http(503, 'DATABASE_UNAVAILABLE'))).toEqual({
      action: 'retry',
      waitS: null,
    });
    expect(classifySendError(http(500))).toEqual({ action: 'retry', waitS: null });
  });

  it('retries any other 404 or 409', () => {
    expect(classifySendError(http(404, 'NOT_FOUND')).action).toBe('retry');
    expect(classifySendError(http(409, 'OTHER')).action).toBe('retry');
  });
});

describe('backoffDelayMs', () => {
  it('doubles from 5 s up to a minute', () => {
    expect([1, 2, 3, 4, 5, 6, 20].map(backoffDelayMs)).toEqual([
      BASE_DELAY_MS,
      10_000,
      20_000,
      40_000,
      MAX_DELAY_MS,
      MAX_DELAY_MS,
      MAX_DELAY_MS,
    ]);
  });

  it('treats 0 or a negative count as the first failure', () => {
    expect(backoffDelayMs(0)).toBe(BASE_DELAY_MS);
    expect(backoffDelayMs(-3)).toBe(BASE_DELAY_MS);
  });
});

describe('retryDelayMs', () => {
  it('uses the usual pause when the server asks for nothing', () => {
    expect(retryDelayMs(2, null)).toBe(10_000);
    expect(retryDelayMs(2, 0)).toBe(10_000);
    expect(retryDelayMs(2, Number.NaN)).toBe(10_000);
  });

  it('waits what the server asks when it is longer', () => {
    expect(retryDelayMs(1, 30)).toBe(30_000);
    expect(retryDelayMs(1, 2.2)).toBe(5_000);
  });

  it('never waits more than five minutes', () => {
    expect(retryDelayMs(1, 99_999)).toBe(300_000);
  });
});
