import { ApiError } from '../api/http';
import type {
  BatchAnswer,
  DetectionPayload,
  DeviceInfo,
  TripClosing,
  TripStarted,
} from '../types/trips';
import { classifySendError, retryDelayMs } from './errors';
import type { DetectionQueue } from './queue';

/** The calls the sender makes, with the session already chosen. */
export interface SenderApi {
  startTrip: (
    body: { device: DeviceInfo; modelVersion: string; startedAt?: string },
    signal?: AbortSignal,
  ) => Promise<TripStarted>;
  sendDetections: (
    tripId: string,
    detections: readonly DetectionPayload[],
    signal?: AbortSignal,
  ) => Promise<BatchAnswer>;
  closeTrip: (tripId: string, closing: TripClosing, signal?: AbortSignal) => Promise<void>;
}

export interface Timers {
  setTimer: (callback: () => void, delayMs: number) => unknown;
  clearTimer: (handle: unknown) => void;
}

const browserTimers: Timers = {
  setTimer: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimer: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/**
 * - `idle`: nothing is being sent (the queue may be empty or waiting for the next kick).
 * - `sending`: a call is in flight.
 * - `waiting`: the last call failed in a way that may pass; trying again soon.
 * - `session_over`, `not_allowed`, `model_outdated`: sending is stopped until the person acts;
 *   the queue is kept.
 */
export type SenderStatus =
  'idle' | 'sending' | 'waiting' | 'session_over' | 'not_allowed' | 'model_outdated';

export interface SenderState {
  status: SenderStatus;
  /** Detections waiting in the queue. */
  pending: number;
  /** Detections the server stored since the page opened. */
  stored: number;
  /** Detections the server refused or that were already there. */
  discarded: number;
  /** Failed tries in a row. */
  failures: number;
}

export interface SenderOptions {
  queue: DetectionQueue;
  api: SenderApi;
  device: DeviceInfo;
  modelVersion: string;
  /** When the person turned the camera on: the trip starts then, not when the first batch goes. */
  startedAt: Date;
  /** Largest batch, until the server says its own limit when it opens a trip. */
  maxBatchSize?: number;
  /** Called each time the server stored detections, e.g. to wake the AI service. */
  onStored?: (count: number) => void;
  timers?: Timers;
}

export interface Sender {
  /** Tries to send what waits, unless a call is already going or the last try failed recently. */
  kick(): void;
  /** Sends what is left and closes the trip; resolves when it is done or gave up. */
  finish(closing: Omit<TripClosing, 'endedAt'>): Promise<void>;
  /** Stops the timers and cancels the call in flight. Nothing is lost: the queue stays. */
  stop(): void;
  getState(): SenderState;
  subscribe(listener: () => void): () => void;
}

const DEFAULT_BATCH = 100;
const MS_PER_DAY = 86_400_000;

/**
 * Sends the queue to the server in batches, opening the trip when the first one goes.
 * Safe to repeat: each detection has its own id, so a lost answer only means sending again.
 * It stops by itself when the session ends, the account may not send, or the model is old.
 */
export function createSender(options: SenderOptions): Sender {
  const { queue, api, device, modelVersion } = options;
  const timers = options.timers ?? browserTimers;
  let batchSize = options.maxBatchSize ?? DEFAULT_BATCH;
  let state: SenderState = {
    status: 'idle',
    pending: queue.size(),
    stored: 0,
    discarded: 0,
    failures: 0,
  };
  const listeners = new Set<() => void>();
  // A new outing starts a new trip; only detections left from before keep theirs.
  if (queue.size() === 0) queue.setTripId(null);
  let busy: Promise<void> | null = null;
  let timer: unknown = null;
  let controller = new AbortController();
  let stopped = false;
  let closed = false;

  const update = (patch: Partial<SenderState>) => {
    state = { ...state, ...patch, pending: queue.size() };
    listeners.forEach((listener) => listener());
  };
  const unsubscribeQueue = queue.subscribe(() => {
    if (state.pending !== queue.size()) update({});
  });

  const clearTimer = () => {
    if (timer !== null) timers.clearTimer(timer);
    timer = null;
  };
  const halt = (status: SenderStatus) => {
    clearTimer();
    update({ status });
  };

  /** Where the trip starts: when the camera turned on, or the oldest detection if that is older. */
  function tripStart(): string | undefined {
    const earliest = queue
      .items()
      .reduce((min, item) => Math.min(min, Date.parse(item.detectedAt)), Infinity);
    const start = Math.min(options.startedAt.getTime(), earliest);
    // The server does not believe a trip older than two days: it uses its own clock then.
    return Date.now() - start < 2 * MS_PER_DAY ? new Date(start).toISOString() : undefined;
  }

  /** Makes sure there is an open trip and gives its id. Throws what the call throws. */
  async function ensureTrip(): Promise<string> {
    const known = queue.tripId();
    if (known) return known;
    const started = await api.startTrip(
      { device, modelVersion, startedAt: tripStart() },
      controller.signal,
    );
    batchSize = Math.min(started.limits.maxBatchSize, options.maxBatchSize ?? DEFAULT_BATCH);
    queue.setTripId(started.tripId);
    return started.tripId;
  }

  /** Sends batch after batch until the queue is empty or something stops it. */
  async function drain(): Promise<void> {
    let newTrips = 0;
    while (!stopped && queue.size() > 0) {
      update({ status: 'sending' });
      try {
        const tripId = await ensureTrip();
        const batch = queue.items().slice(0, batchSize);
        const answer = await api.sendDetections(tripId, batch, controller.signal);
        // Stored, repeated or refused: in every case the server is done with them.
        queue.remove(batch.map((item) => item.id));
        update({
          stored: state.stored + answer.stored,
          discarded: state.discarded + answer.duplicates + answer.rejected.length,
          failures: 0,
        });
        newTrips = 0;
        if (answer.stored > 0) options.onStored?.(answer.stored);
      } catch (error) {
        if (stopped) return;
        const failure = classifySendError(
          error instanceof ApiError ? error : { kind: 'network' as const },
        );
        if (failure.action === 'new_trip' && newTrips < 1) {
          newTrips += 1;
          queue.setTripId(null);
          continue;
        }
        if (failure.action === 'drop_batch') {
          const batch = queue.items().slice(0, batchSize);
          queue.remove(batch.map((item) => item.id));
          update({ discarded: state.discarded + batch.length });
          continue;
        }
        if (failure.action === 'session_over') return halt('session_over');
        if (failure.action === 'not_allowed') return halt('not_allowed');
        if (failure.action === 'model_outdated') return halt('model_outdated');
        const failures = state.failures + 1;
        const waitS = failure.action === 'retry' ? failure.waitS : null;
        update({ status: 'waiting', failures });
        clearTimer();
        timer = timers.setTimer(
          () => {
            timer = null;
            void run();
          },
          retryDelayMs(failures, waitS),
        );
        return;
      }
    }
    update({ status: 'idle' });
  }

  function run(): Promise<void> {
    if (stopped) return Promise.resolve();
    if (busy) return busy;
    busy = drain().finally(() => {
      busy = null;
    });
    return busy;
  }

  return {
    kick() {
      // While waiting after a failure the timer decides; a new detection must not skip the pause.
      if (state.status === 'waiting' || queue.size() === 0) return;
      if (state.status === 'session_over' || state.status === 'not_allowed') return;
      if (state.status === 'model_outdated') return;
      void run();
    },
    async finish(closing) {
      if (stopped || closed) return;
      clearTimer();
      if (state.status === 'waiting') update({ status: 'idle' });
      await run();
      const tripId = queue.tripId();
      // A trip with detections still waiting stays open: it accepts them for 24 hours.
      if (!tripId || queue.size() > 0 || stopped) return;
      try {
        await api.closeTrip(tripId, closing, controller.signal);
        closed = true;
        queue.setTripId(null);
      } catch {
        // Closing is only the summary: the detections are safe, so a failure is not reported.
      }
    },
    stop() {
      stopped = true;
      clearTimer();
      controller.abort();
      controller = new AbortController();
      unsubscribeQueue();
    },
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
