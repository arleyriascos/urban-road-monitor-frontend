import type { ApiError } from '../api/http';
import { retryAfterSeconds } from '../lib/route-errors';

/**
 * What the sender does after a failed call:
 * - `retry`: nothing is wrong with the data; try again after a pause (no signal, slow server,
 *   too many requests, server down).
 * - `new_trip`: the trip is closed or unknown; open another one and send again.
 * - `session_over`: the session no longer lives (401). The queue is kept for the next sign-in.
 * - `not_allowed`: this account may not send (403). The queue is kept.
 * - `model_outdated`: the phone has an old model (409); sending waits for an update.
 * - `drop_batch`: the server says the batch itself is wrong (400); trying again would fail
 *   forever, so the batch is discarded.
 */
export type SendFailure =
  | { action: 'retry'; waitS: number | null }
  | { action: 'new_trip' }
  | { action: 'session_over' }
  | { action: 'not_allowed' }
  | { action: 'model_outdated' }
  | { action: 'drop_batch' };

export function classifySendError(
  error: Pick<ApiError, 'kind' | 'status' | 'code' | 'details'>,
): SendFailure {
  if (error.kind !== 'http') return { action: 'retry', waitS: null };
  switch (error.status) {
    case 401:
      return { action: 'session_over' };
    case 403:
      return { action: 'not_allowed' };
    case 404:
      return error.code === 'TRIP_NOT_FOUND'
        ? { action: 'new_trip' }
        : { action: 'retry', waitS: null };
    case 409:
      if (error.code === 'TRIP_CLOSED') return { action: 'new_trip' };
      if (error.code === 'MODEL_VERSION_MISMATCH') return { action: 'model_outdated' };
      return { action: 'retry', waitS: null };
    case 400:
      return { action: 'drop_batch' };
    case 429:
      return { action: 'retry', waitS: retryAfterSeconds(error) ?? null };
    default:
      return { action: 'retry', waitS: null };
  }
}

export const BASE_DELAY_MS = 5_000;
export const MAX_DELAY_MS = 60_000;

/** The pause before trying again: 5 s, 10 s, 20 s, 40 s and then 60 s (`failures` starts at 1). */
export function backoffDelayMs(failures: number): number {
  const exponent = Math.max(0, failures - 1);
  return Math.min(BASE_DELAY_MS * 2 ** exponent, MAX_DELAY_MS);
}

/** The pause to use: what the server asked for, if it asked for more than the usual one. */
export function retryDelayMs(failures: number, waitS: number | null): number {
  const usual = backoffDelayMs(failures);
  if (waitS === null || !Number.isFinite(waitS) || waitS <= 0) return usual;
  return Math.min(Math.max(usual, Math.ceil(waitS) * 1000), 5 * 60_000);
}
