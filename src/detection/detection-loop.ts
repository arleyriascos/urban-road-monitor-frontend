import type { DetectionResult, Detector } from './detector';
import type { FrameSize } from './types';

/** About 3 detections per second: enough to follow a road at walking or driving pace. */
export const TARGET_INTERVAL_MS = 333;

export interface Timers {
  now: () => number;
  setTimer: (callback: () => void, delayMs: number) => unknown;
  clearTimer: (handle: unknown) => void;
}

const browserTimers: Timers = {
  now: () => performance.now(),
  setTimer: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimer: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export interface DetectionLoopOptions {
  detector: Detector;
  /** The picture to analyze now, or null when there is none ready yet. */
  getSource: () => { source: CanvasImageSource; frame: FrameSize } | null;
  onResult: (result: DetectionResult) => void;
  onError: (error: unknown) => void;
  intervalMs?: number;
  timers?: Timers;
}

export interface DetectionLoop {
  start(): void;
  stop(): void;
  isRunning(): boolean;
}

/**
 * Runs the detector again and again at a steady pace. Only one detection runs at a time: if
 * the phone is slower than the target, the next one starts as soon as the last one ends
 * instead of piling up work. The wait is counted from the start of each detection.
 */
export function createDetectionLoop(options: DetectionLoopOptions): DetectionLoop {
  const { detector, getSource, onResult, onError } = options;
  const interval = options.intervalMs ?? TARGET_INTERVAL_MS;
  const timers = options.timers ?? browserTimers;
  let running = false;
  let handle: unknown = null;
  let generation = 0;

  const schedule = (delayMs: number) => {
    handle = timers.setTimer(() => void tick(), Math.max(0, delayMs));
  };

  async function tick(): Promise<void> {
    handle = null;
    if (!running) return;
    const mine = generation;
    const begin = timers.now();
    const picture = getSource();
    if (picture) {
      try {
        const result = await detector.detect(picture.source, picture.frame);
        if (running && mine === generation) onResult(result);
      } catch (error) {
        if (running && mine === generation) onError(error);
      }
    }
    if (running && mine === generation) schedule(interval - (timers.now() - begin));
  }

  return {
    start() {
      if (running) return;
      running = true;
      generation += 1;
      schedule(0);
    },
    stop() {
      running = false;
      generation += 1;
      if (handle !== null) timers.clearTimer(handle);
      handle = null;
    },
    isRunning: () => running,
  };
}
