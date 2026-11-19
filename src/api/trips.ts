import type {
  BatchAnswer,
  DeviceInfo,
  DetectionPayload,
  TripClosing,
  TripPage,
  TripStarted,
  TripView,
} from '../types/trips';
import { getJson, patchJson, postJson } from './http';

/** Opens a trip. `modelVersion` must be the one the server has active. */
export function startTrip(
  token: string,
  body: { device: DeviceInfo; modelVersion: string; startedAt?: string },
  signal?: AbortSignal,
): Promise<TripStarted> {
  return postJson<TripStarted>('/api/trips', body, { token, signal });
}

/** Sends a batch of 1 to 100 detections. Sending the same ones again is safe. */
export function sendDetections(
  token: string,
  tripId: string,
  detections: readonly DetectionPayload[],
  signal?: AbortSignal,
): Promise<BatchAnswer> {
  return postJson<BatchAnswer>(
    `/api/trips/${encodeURIComponent(tripId)}/detections`,
    { detections },
    { token, signal },
  );
}

/** Closes the trip. Closing it twice is safe: the first numbers stay. */
export async function closeTrip(
  token: string,
  tripId: string,
  closing: TripClosing,
  signal?: AbortSignal,
): Promise<void> {
  await patchJson<unknown>(`/api/trips/${encodeURIComponent(tripId)}`, closing, { token, signal });
}

/** The trips of the person, newest first. Pass the `nextCursor` of a page to read the next one. */
export function listTrips(
  token: string,
  options: { limit?: number; cursor?: string; signal?: AbortSignal } = {},
): Promise<TripPage> {
  const query = new URLSearchParams();
  if (options.limit !== undefined) query.set('limit', String(options.limit));
  if (options.cursor !== undefined) query.set('cursor', options.cursor);
  const text = query.toString();
  return getJson<TripPage>(`/api/trips${text ? `?${text}` : ''}`, {
    token,
    signal: options.signal,
  });
}

/** One trip of the person with its detections counted by severity. */
export function getTrip(token: string, tripId: string, signal?: AbortSignal): Promise<TripView> {
  return getJson<TripView>(`/api/trips/${encodeURIComponent(tripId)}`, { token, signal });
}
