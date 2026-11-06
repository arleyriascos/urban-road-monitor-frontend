import { aiServiceUrl } from '../config/env';

/** Waking up is asked again at most this often, so retries do not flood the service. */
export const WAKE_INTERVAL_MS = 20_000;

interface WakerOptions {
  url: string | null;
  fetch?: (input: string, init: RequestInit) => Promise<unknown>;
  now?: () => number;
  intervalMs?: number;
}

/**
 * The AI service (Render, free plan) falls asleep after a few minutes without use, and
 * Render only wakes it when a browser asks: the backend's requests are refused with
 * "hibernate-rate-limited". So the browser wakes it: a request to its public /health,
 * without waiting for the answer and without reading it ("no-cors": no token, no data).
 */
export function createAiServiceWaker({
  url,
  fetch: send = (input, init) => globalThis.fetch(input, init),
  now = Date.now,
  intervalMs = WAKE_INTERVAL_MS,
}: WakerOptions): () => boolean {
  let lastWakeAt = Number.NEGATIVE_INFINITY;

  return function wake() {
    if (!url) return false;
    const time = now();
    if (time - lastWakeAt < intervalMs) return false;
    lastWakeAt = time;
    send(`${url}/health`, { mode: 'no-cors', cache: 'no-store' }).catch(() => undefined);
    return true;
  };
}

/** Starts waking the AI service up; returns false when it is not configured or was just asked. */
export const wakeAiService = createAiServiceWaker({ url: aiServiceUrl });
