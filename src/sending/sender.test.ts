import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import type { BatchAnswer, DetectionPayload, TripStarted } from '../types/trips';
import { createDetectionQueue } from './queue';
import { createSender, type SenderApi, type SenderOptions, type Timers } from './sender';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  } as unknown as Storage;
}

function detection(n: number): DetectionPayload {
  return {
    id: `id-${n}`,
    latitude: 1.2,
    longitude: -77.3,
    gpsAccuracyM: 5,
    confidence: 0.8,
    bboxAreaRatio: 0.02,
    detectedAt: new Date(Date.now() - 1000).toISOString(),
  };
}

const STARTED: TripStarted = {
  tripId: 'trip-1',
  deviceId: 'device-1',
  startedAt: '2026-11-16T13:30:00.000Z',
  model: { version: '1.0.0', minConfidence: 0.4 },
  limits: { maxGpsAccuracyM: 20, maxBatchSize: 100 },
};

const answer = (overrides: Partial<BatchAnswer> = {}): BatchAnswer => ({
  received: 0,
  stored: 0,
  duplicates: 0,
  rejected: [],
  ...overrides,
});

const httpError = (status: number, code: string, details?: Record<string, unknown>) =>
  new ApiError('http', code, status, code, details);

function manualTimers() {
  const pending: { callback: () => void; delayMs: number; handle: number }[] = [];
  let next = 1;
  const timers: Timers = {
    setTimer: (callback, delayMs) => {
      const handle = next++;
      const fire = () => {
        const index = pending.findIndex((entry) => entry.handle === handle);
        if (index >= 0) pending.splice(index, 1);
        callback();
      };
      pending.push({ callback: fire, delayMs, handle });
      return handle;
    },
    clearTimer: (handle) => {
      const index = pending.findIndex((entry) => entry.handle === handle);
      if (index >= 0) pending.splice(index, 1);
    },
  };
  return { timers, pending };
}

function setup(overrides: Partial<SenderApi> = {}, extra: Partial<SenderOptions> = {}) {
  const queue = createDetectionQueue(() => memoryStorage());
  const api: SenderApi = {
    startTrip: vi.fn(async () => STARTED),
    sendDetections: vi.fn(async (_trip, batch) =>
      answer({ received: batch.length, stored: batch.length }),
    ),
    closeTrip: vi.fn(async () => undefined),
    ...overrides,
  };
  const clock = manualTimers();
  const sender = createSender({
    queue,
    api,
    device: { platform: 'android' },
    modelVersion: '1.0.0',
    startedAt: new Date(Date.now() - 60_000),
    timers: clock.timers,
    ...extra,
  });
  return { queue, api, sender, clock };
}

const fill = (queue: ReturnType<typeof createDetectionQueue>, count: number, from = 1) => {
  for (let n = from; n < from + count; n++) queue.push(detection(n));
};

describe('the sender', () => {
  it('does nothing while the queue is empty', async () => {
    const { sender, api } = setup();
    sender.kick();
    expect(api.startTrip).not.toHaveBeenCalled();
    expect(sender.getState().status).toBe('idle');
  });

  it('opens the trip with the device and the model, then sends and empties the queue', async () => {
    const { sender, api, queue } = setup();
    fill(queue, 3);
    sender.kick();
    await vi.waitFor(() => expect(queue.size()).toBe(0));

    expect(api.startTrip).toHaveBeenCalledTimes(1);
    const body = vi.mocked(api.startTrip).mock.calls[0][0];
    expect(body.device).toEqual({ platform: 'android' });
    expect(body.modelVersion).toBe('1.0.0');
    expect(vi.mocked(api.sendDetections).mock.calls[0][0]).toBe('trip-1');
    expect(vi.mocked(api.sendDetections).mock.calls[0][1]).toHaveLength(3);
    expect(sender.getState()).toMatchObject({ status: 'idle', stored: 3, pending: 0, failures: 0 });
    expect(queue.tripId()).toBe('trip-1');
  });

  it('starts the trip when the camera turned on, or earlier if a detection is older', async () => {
    const startedAt = new Date(Date.now() - 600_000);
    const { sender, api, queue } = setup({}, { startedAt });
    fill(queue, 1);
    sender.kick();
    await vi.waitFor(() => expect(api.startTrip).toHaveBeenCalled());
    expect(vi.mocked(api.startTrip).mock.calls[0][0].startedAt).toBe(startedAt.toISOString());

    const old = new Date(Date.now() - 900_000).toISOString();
    const other = setup();
    other.queue.push({ ...detection(9), detectedAt: old });
    other.sender.kick();
    await vi.waitFor(() => expect(other.api.startTrip).toHaveBeenCalled());
    expect(vi.mocked(other.api.startTrip).mock.calls[0][0].startedAt).toBe(old);
  });

  it('leaves the start to the server when everything is older than two days', async () => {
    const { sender, api, queue } = setup({}, { startedAt: new Date(Date.now() - 3 * 86_400_000) });
    queue.push({
      ...detection(1),
      detectedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    });
    sender.kick();
    await vi.waitFor(() => expect(api.startTrip).toHaveBeenCalled());
    expect(vi.mocked(api.startTrip).mock.calls[0][0].startedAt).toBeUndefined();
  });

  it('sends batches no bigger than the limit', async () => {
    const { sender, api, queue } = setup();
    fill(queue, 250);
    sender.kick();
    await vi.waitFor(() => expect(queue.size()).toBe(0));
    expect(vi.mocked(api.sendDetections).mock.calls.map((call) => call[1].length)).toEqual([
      100, 100, 50,
    ]);
    expect(api.startTrip).toHaveBeenCalledTimes(1);
  });

  it('uses a smaller limit when the server announces one', async () => {
    const { sender, api, queue } = setup({
      startTrip: vi.fn(async () => ({
        ...STARTED,
        limits: { maxGpsAccuracyM: 20, maxBatchSize: 40 },
      })),
    });
    fill(queue, 90);
    sender.kick();
    await vi.waitFor(() => expect(queue.size()).toBe(0));
    expect(vi.mocked(api.sendDetections).mock.calls.map((call) => call[1].length)).toEqual([
      40, 40, 10,
    ]);
  });

  it('counts the refused and repeated ones as done: sending them again changes nothing', async () => {
    const { sender, queue } = setup({
      sendDetections: vi.fn(async () =>
        answer({
          received: 3,
          stored: 1,
          duplicates: 1,
          rejected: [{ id: 'id-3', reason: 'low_confidence' }],
        }),
      ),
    });
    fill(queue, 3);
    sender.kick();
    await vi.waitFor(() => expect(queue.size()).toBe(0));
    expect(sender.getState()).toMatchObject({ stored: 1, discarded: 2 });
  });

  it('tells when the server stored something', async () => {
    const onStored = vi.fn();
    const { sender, queue } = setup({}, { onStored });
    fill(queue, 2);
    sender.kick();
    await vi.waitFor(() => expect(onStored).toHaveBeenCalledWith(2));
  });

  it('keeps the queue and waits 5 s when there is no connection', async () => {
    const send = vi
      .fn<SenderApi['sendDetections']>()
      .mockRejectedValueOnce(new ApiError('network', 'down'))
      .mockImplementation(async (_t, batch) => answer({ stored: batch.length }));
    const { sender, queue, clock } = setup({ sendDetections: send });
    fill(queue, 2);
    sender.kick();
    await vi.waitFor(() => expect(sender.getState().status).toBe('waiting'));

    expect(queue.size()).toBe(2);
    expect(sender.getState().failures).toBe(1);
    expect(clock.pending.map((timer) => timer.delayMs)).toEqual([5_000]);

    clock.pending[0].callback();
    await vi.waitFor(() => expect(queue.size()).toBe(0));
    expect(sender.getState()).toMatchObject({ status: 'idle', failures: 0 });
  });

  it('makes the pause longer after each failure in a row', async () => {
    const send = vi.fn<SenderApi['sendDetections']>(async () => {
      throw new ApiError('timeout', 'slow');
    });
    const { sender, queue, clock } = setup({ sendDetections: send });
    fill(queue, 1);
    sender.kick();
    await vi.waitFor(() => expect(clock.pending).toHaveLength(1));
    clock.pending[0].callback();
    await vi.waitFor(() => expect(sender.getState().failures).toBe(2));
    await vi.waitFor(() => expect(clock.pending.map((t) => t.delayMs)).toEqual([10_000]));
  });

  it('does not skip the pause when a new detection arrives while waiting', async () => {
    const send = vi.fn<SenderApi['sendDetections']>(async () => {
      throw new ApiError('network', 'down');
    });
    const { sender, queue } = setup({ sendDetections: send });
    fill(queue, 1);
    sender.kick();
    await vi.waitFor(() => expect(sender.getState().status).toBe('waiting'));
    queue.push(detection(2));
    sender.kick();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('waits what the server asks after a 429', async () => {
    const send = vi.fn<SenderApi['sendDetections']>(async () => {
      throw httpError(429, 'TOO_MANY_REQUESTS', { retryAfterS: 30 });
    });
    const { sender, queue, clock } = setup({ sendDetections: send });
    fill(queue, 1);
    sender.kick();
    await vi.waitFor(() => expect(clock.pending.map((t) => t.delayMs)).toEqual([30_000]));
  });

  it('opens another trip when the trip is closed, and sends the same detections', async () => {
    const send = vi
      .fn<SenderApi['sendDetections']>()
      .mockRejectedValueOnce(httpError(409, 'TRIP_CLOSED'))
      .mockImplementation(async (_t, batch) => answer({ stored: batch.length }));
    const start = vi
      .fn<SenderApi['startTrip']>()
      .mockResolvedValueOnce(STARTED)
      .mockResolvedValueOnce({ ...STARTED, tripId: 'trip-2' });
    const { sender, queue } = setup({ sendDetections: send, startTrip: start });
    fill(queue, 2);
    sender.kick();
    await vi.waitFor(() => expect(queue.size()).toBe(0));
    expect(start).toHaveBeenCalledTimes(2);
    expect(send.mock.calls.map((call) => call[0])).toEqual(['trip-1', 'trip-2']);
    expect(send.mock.calls[1][1].map((d) => d.id)).toEqual(['id-1', 'id-2']);
  });

  it('does not open trips forever when each new trip is closed too', async () => {
    const send = vi.fn<SenderApi['sendDetections']>(async () => {
      throw httpError(409, 'TRIP_CLOSED');
    });
    const { sender, queue, api } = setup({ sendDetections: send });
    fill(queue, 1);
    sender.kick();
    await vi.waitFor(() => expect(sender.getState().status).toBe('waiting'));
    expect(api.startTrip).toHaveBeenCalledTimes(2);
    expect(queue.size()).toBe(1);
  });

  it('reuses the trip that was saved before the page closed', async () => {
    const { sender, queue, api } = setup();
    queue.setTripId('trip-old');
    fill(queue, 1);
    sender.kick();
    await vi.waitFor(() => expect(queue.size()).toBe(0));
    expect(api.startTrip).not.toHaveBeenCalled();
    expect(vi.mocked(api.sendDetections).mock.calls[0][0]).toBe('trip-old');
  });

  it.each([
    ['session_over', 401, 'UNAUTHORIZED'],
    ['not_allowed', 403, 'FORBIDDEN'],
  ] as const)(
    'stops with %s and keeps the queue when the server answers %i',
    async (status, code, name) => {
      const send = vi.fn<SenderApi['sendDetections']>(async () => {
        throw httpError(code, name);
      });
      const { sender, queue, clock } = setup({ sendDetections: send });
      fill(queue, 2);
      sender.kick();
      await vi.waitFor(() => expect(sender.getState().status).toBe(status));
      expect(queue.size()).toBe(2);
      expect(clock.pending).toHaveLength(0);

      sender.kick(); // It does not insist.
      expect(send).toHaveBeenCalledTimes(1);
    },
  );

  it('stops when the model of the phone is not the active one, from the trip start', async () => {
    const { sender, queue } = setup({
      startTrip: vi.fn(async () => {
        throw httpError(409, 'MODEL_VERSION_MISMATCH', { expected: '1.1.0' });
      }),
    });
    fill(queue, 1);
    sender.kick();
    await vi.waitFor(() => expect(sender.getState().status).toBe('model_outdated'));
    expect(queue.size()).toBe(1);
  });

  it('discards a batch the server calls invalid and goes on with the rest', async () => {
    const send = vi
      .fn<SenderApi['sendDetections']>()
      .mockRejectedValueOnce(httpError(400, 'INVALID_REQUEST'))
      .mockImplementation(async (_t, batch) => answer({ stored: batch.length }));
    const { sender, queue } = setup({ sendDetections: send }, { maxBatchSize: 2 });
    fill(queue, 3);
    sender.kick();
    await vi.waitFor(() => expect(queue.size()).toBe(0));
    expect(sender.getState()).toMatchObject({ stored: 1, discarded: 2 });
  });

  it('retryNow skips the pause after a failure', async () => {
    const send = vi
      .fn<SenderApi['sendDetections']>()
      .mockRejectedValueOnce(new ApiError('network', 'down'))
      .mockImplementation(async (_t, batch) => answer({ stored: batch.length }));
    const { sender, queue, clock } = setup({ sendDetections: send });
    fill(queue, 1);
    sender.kick();
    await vi.waitFor(() => expect(sender.getState().status).toBe('waiting'));

    sender.retryNow();
    await vi.waitFor(() => expect(queue.size()).toBe(0));
    expect(clock.pending).toHaveLength(0);
  });

  it('retryNow does not insist when sending is stopped on purpose', async () => {
    const send = vi.fn<SenderApi['sendDetections']>(async () => {
      throw httpError(401, 'UNAUTHORIZED');
    });
    const { sender, queue } = setup({ sendDetections: send });
    fill(queue, 1);
    sender.kick();
    await vi.waitFor(() => expect(sender.getState().status).toBe('session_over'));
    sender.retryNow();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('asks for the start of the trip when it is time to open it, not before', async () => {
    let begin = new Date(Date.now() - 600_000);
    const { sender, api, queue } = setup({}, { startedAt: () => begin });
    begin = new Date(Date.now() - 120_000);
    fill(queue, 1);
    sender.kick();
    await vi.waitFor(() => expect(api.startTrip).toHaveBeenCalled());
    expect(vi.mocked(api.startTrip).mock.calls[0][0].startedAt).toBe(begin.toISOString());
  });

  it('keeps pending in step with the queue', () => {
    const { sender, queue } = setup();
    const listener = vi.fn();
    sender.subscribe(listener);
    queue.push(detection(1));
    expect(sender.getState().pending).toBe(1);
    expect(listener).toHaveBeenCalled();
  });

  describe('finish', () => {
    it('sends what is left and closes the trip with the totals', async () => {
      const { sender, queue, api } = setup();
      fill(queue, 2);
      await sender.finish({ framesAnalyzed: 3600, distanceM: 1250.5 });
      expect(queue.size()).toBe(0);
      expect(api.closeTrip).toHaveBeenCalledWith(
        'trip-1',
        { framesAnalyzed: 3600, distanceM: 1250.5 },
        expect.anything(),
      );
      expect(queue.tripId()).toBeNull();
    });

    it('does not open a trip when nothing was ever detected', async () => {
      const { sender, api } = setup();
      await sender.finish({ framesAnalyzed: 100, distanceM: 10 });
      expect(api.startTrip).not.toHaveBeenCalled();
      expect(api.closeTrip).not.toHaveBeenCalled();
    });

    it('leaves the trip open when detections could not be sent', async () => {
      const send = vi.fn<SenderApi['sendDetections']>(async () => {
        throw new ApiError('network', 'down');
      });
      const { sender, queue, api } = setup({ sendDetections: send });
      fill(queue, 1);
      await sender.finish({ framesAnalyzed: 1, distanceM: 0 });
      expect(api.closeTrip).not.toHaveBeenCalled();
      expect(queue.size()).toBe(1);
      expect(queue.tripId()).toBe('trip-1');
    });

    it('does not complain when closing fails: the detections are safe', async () => {
      const { sender, queue } = setup({
        closeTrip: vi.fn(async () => {
          throw new ApiError('network', 'down');
        }),
      });
      fill(queue, 1);
      await expect(sender.finish({ framesAnalyzed: 1, distanceM: 0 })).resolves.toBeUndefined();
    });

    it('closes the trip of a second outing in the same visit to the page', async () => {
      const second: TripStarted = { ...STARTED, tripId: 'trip-2' };
      const startTrip = vi
        .fn<SenderApi['startTrip']>()
        .mockResolvedValueOnce(STARTED)
        .mockResolvedValueOnce(second);
      const { sender, queue, api } = setup({ startTrip });
      fill(queue, 1);
      await sender.finish({ framesAnalyzed: 10, distanceM: 5 });
      fill(queue, 1, 10);
      await sender.finish({ framesAnalyzed: 20, distanceM: 8 });

      expect(api.closeTrip).toHaveBeenCalledTimes(2);
      expect(vi.mocked(api.closeTrip).mock.calls[1][0]).toBe('trip-2');
      expect(vi.mocked(api.closeTrip).mock.calls[1][1]).toEqual({
        framesAnalyzed: 20,
        distanceM: 8,
      });
    });

    it('closes the trip later, once the detections that were waiting are sent', async () => {
      let online = false;
      const send = vi.fn<SenderApi['sendDetections']>(async (_trip, batch) => {
        if (!online) throw new ApiError('network', 'down');
        return answer({ received: batch.length, stored: batch.length });
      });
      const { sender, queue, api } = setup({ sendDetections: send });
      fill(queue, 2);
      await sender.finish({ framesAnalyzed: 300, distanceM: 90 });
      expect(api.closeTrip).not.toHaveBeenCalled();

      online = true;
      sender.retryNow();
      await vi.waitFor(() => expect(api.closeTrip).toHaveBeenCalledTimes(1));
      expect(api.closeTrip).toHaveBeenCalledWith(
        'trip-1',
        { framesAnalyzed: 300, distanceM: 90 },
        expect.anything(),
      );
      expect(queue.tripId()).toBeNull();
    });

    it('tries to close again when the first try failed', async () => {
      let failing = true;
      const closeTrip = vi.fn<SenderApi['closeTrip']>(async () => {
        if (failing) throw new ApiError('network', 'down');
      });
      const { sender, queue } = setup({ closeTrip });
      fill(queue, 1);
      await sender.finish({ framesAnalyzed: 1, distanceM: 0 });
      expect(queue.tripId()).toBe('trip-1');

      failing = false;
      fill(queue, 1, 20);
      sender.kick();
      await vi.waitFor(() => expect(closeTrip).toHaveBeenCalledTimes(2));
      await vi.waitFor(() => expect(queue.tripId()).toBeNull());
    });

    it('does not close a new trip with the totals of an outing with no detections', async () => {
      const { sender, queue, api } = setup();
      await sender.finish({ framesAnalyzed: 100, distanceM: 10 });
      fill(queue, 1);
      sender.kick();
      await vi.waitFor(() => expect(queue.size()).toBe(0));

      expect(api.closeTrip).not.toHaveBeenCalled();
      expect(queue.tripId()).toBe('trip-1');
    });

    it('closes only once', async () => {
      const { sender, queue, api } = setup();
      fill(queue, 1);
      await sender.finish({ framesAnalyzed: 1, distanceM: 0 });
      await sender.finish({ framesAnalyzed: 1, distanceM: 0 });
      expect(api.closeTrip).toHaveBeenCalledTimes(1);
    });
  });

  it('stop cancels the timers and the call in flight, and keeps the queue', async () => {
    let signal: AbortSignal | undefined;
    const send = vi.fn<SenderApi['sendDetections']>(
      (_t, _b, abort) =>
        new Promise((_resolve, reject) => {
          signal = abort;
          abort?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const { sender, queue, clock } = setup({ sendDetections: send });
    fill(queue, 2);
    sender.kick();
    await vi.waitFor(() => expect(send).toHaveBeenCalled());
    sender.stop();
    expect(signal?.aborted).toBe(true);
    await Promise.resolve();
    expect(queue.size()).toBe(2);
    expect(clock.pending).toHaveLength(0);
    sender.kick();
    expect(send).toHaveBeenCalledTimes(1);
  });
});
