import { describe, expect, it, vi } from 'vitest';
import { createDetectionLoop, TARGET_INTERVAL_MS, type Timers } from './detection-loop';
import type { DetectionResult, Detector } from './detector';

const FRAME = { width: 100, height: 50 };
const RESULT: DetectionResult = {
  detections: [],
  frame: FRAME,
  timings: { captureMs: 1, inferenceMs: 2, totalMs: 3 },
};

/** A clock and timers that only move when the test says so. */
function fakeTimers() {
  let time = 0;
  let next = 1;
  const pending = new Map<number, { at: number; callback: () => void }>();
  const timers: Timers = {
    now: () => time,
    setTimer: (callback, delayMs) => {
      const id = next++;
      pending.set(id, { at: time + delayMs, callback });
      return id;
    },
    clearTimer: (handle) => void pending.delete(handle as number),
  };
  const advance = async (ms: number) => {
    time += ms;
    for (const [id, timer] of [...pending]) {
      if (timer.at <= time) {
        pending.delete(id);
        timer.callback();
      }
    }
    await Promise.resolve();
    await Promise.resolve();
  };
  return { timers, advance, pending, setTime: (value: number) => (time = value) };
}

const source = { source: {} as CanvasImageSource, frame: FRAME };

describe('createDetectionLoop', () => {
  it('detects right away and reports the result', async () => {
    const { timers, advance } = fakeTimers();
    const detector: Detector = { detect: vi.fn(async () => RESULT) };
    const onResult = vi.fn();
    const loop = createDetectionLoop({
      detector,
      getSource: () => source,
      onResult,
      onError: vi.fn(),
      timers,
    });

    loop.start();
    await advance(0);

    expect(detector.detect).toHaveBeenCalledWith(source.source, FRAME);
    expect(onResult).toHaveBeenCalledWith(RESULT);
  });

  it('waits for the rest of the interval before the next detection', async () => {
    const fake = fakeTimers();
    const detector: Detector = {
      detect: vi.fn(async () => {
        fake.setTime(100); // this detection took 100 ms
        return RESULT;
      }),
    };
    const loop = createDetectionLoop({
      detector,
      getSource: () => source,
      onResult: vi.fn(),
      onError: vi.fn(),
      timers: fake.timers,
    });

    loop.start();
    await fake.advance(0);
    expect(detector.detect).toHaveBeenCalledTimes(1);

    await fake.advance(TARGET_INTERVAL_MS - 100 - 1);
    expect(detector.detect).toHaveBeenCalledTimes(1);
    await fake.advance(1);
    expect(detector.detect).toHaveBeenCalledTimes(2);
  });

  it('never runs two detections at once', async () => {
    const fake = fakeTimers();
    let inside = 0;
    let most = 0;
    const detector: Detector = {
      detect: vi.fn(async () => {
        inside += 1;
        most = Math.max(most, inside);
        await new Promise((resolve) => setTimeout(resolve, 5));
        inside -= 1;
        return RESULT;
      }),
    };
    const loop = createDetectionLoop({
      detector,
      getSource: () => source,
      onResult: vi.fn(),
      onError: vi.fn(),
      timers: fake.timers,
    });
    loop.start();
    for (let step = 0; step < 6; step += 1) {
      await fake.advance(400);
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(most).toBe(1);
  });

  it('skips the turn when there is no picture yet and keeps going', async () => {
    const fake = fakeTimers();
    const detector: Detector = { detect: vi.fn(async () => RESULT) };
    let ready = false;
    const loop = createDetectionLoop({
      detector,
      getSource: () => (ready ? source : null),
      onResult: vi.fn(),
      onError: vi.fn(),
      timers: fake.timers,
    });

    loop.start();
    await fake.advance(0);
    expect(detector.detect).not.toHaveBeenCalled();

    ready = true;
    await fake.advance(TARGET_INTERVAL_MS);
    expect(detector.detect).toHaveBeenCalledTimes(1);
  });

  it('reports an error and keeps going', async () => {
    const fake = fakeTimers();
    const boom = new Error('boom');
    const detector: Detector = {
      detect: vi.fn().mockRejectedValueOnce(boom).mockResolvedValue(RESULT),
    };
    const onError = vi.fn();
    const onResult = vi.fn();
    const loop = createDetectionLoop({
      detector,
      getSource: () => source,
      onResult,
      onError,
      timers: fake.timers,
    });

    loop.start();
    await fake.advance(0);
    expect(onError).toHaveBeenCalledWith(boom);

    await fake.advance(TARGET_INTERVAL_MS);
    expect(onResult).toHaveBeenCalledWith(RESULT);
  });

  it('stops: no more detections and no pending timer', async () => {
    const fake = fakeTimers();
    const detector: Detector = { detect: vi.fn(async () => RESULT) };
    const loop = createDetectionLoop({
      detector,
      getSource: () => source,
      onResult: vi.fn(),
      onError: vi.fn(),
      timers: fake.timers,
    });
    loop.start();
    await fake.advance(0);

    loop.stop();

    expect(loop.isRunning()).toBe(false);
    expect(fake.pending.size).toBe(0);
    await fake.advance(5000);
    expect(detector.detect).toHaveBeenCalledTimes(1);
  });

  it('drops the result of a detection that ends after stop', async () => {
    const fake = fakeTimers();
    let finish: (result: DetectionResult) => void = () => undefined;
    const detector: Detector = {
      detect: vi.fn(() => new Promise<DetectionResult>((resolve) => (finish = resolve))),
    };
    const onResult = vi.fn();
    const loop = createDetectionLoop({
      detector,
      getSource: () => source,
      onResult,
      onError: vi.fn(),
      timers: fake.timers,
    });
    loop.start();
    await fake.advance(0);

    loop.stop();
    finish(RESULT);
    await Promise.resolve();
    await Promise.resolve();

    expect(onResult).not.toHaveBeenCalled();
    expect(fake.pending.size).toBe(0);
  });

  it('starting twice does not duplicate the loop', async () => {
    const fake = fakeTimers();
    const detector: Detector = { detect: vi.fn(async () => RESULT) };
    const loop = createDetectionLoop({
      detector,
      getSource: () => source,
      onResult: vi.fn(),
      onError: vi.fn(),
      timers: fake.timers,
    });
    loop.start();
    loop.start();
    await fake.advance(0);
    expect(detector.detect).toHaveBeenCalledTimes(1);
  });
});
