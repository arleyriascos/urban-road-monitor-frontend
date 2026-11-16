import type {
  BatchAnswer,
  DeviceInfo,
  DetectionPayload,
  TripClosing,
  TripStarted,
} from '../types/trips';
import { patchJson, postJson } from './http';

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
