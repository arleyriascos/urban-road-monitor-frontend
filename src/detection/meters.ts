import type { PotholeSeverity } from '../types/map';
import type { DetectionResult } from './detector';
import { RingBuffer } from './ring-buffer';
import { severityOf } from './severity';
import { sizeRatio } from './size';
import { mean, median, ratePerSecond } from './stats';

/** The last measurements kept to show a steady number: about ten seconds at 3 per second. */
export const METER_WINDOW = 30;

/** Meter 1: how well the phone is doing the work. Empty values are null until measured. */
export interface PerformanceReading {
  /** Detections per second over the last measurements. */
  fps: number | null;
  /** Typical time of the model alone, in milliseconds. */
  inferenceMs: number | null;
  /** Typical time of the whole detection (capture, model and decoding), in milliseconds. */
  totalMs: number | null;
}

/** One box with its size and severity. */
export interface SizeReading {
  /** The share of the picture that the box covers, from 0 to 1. */
  ratio: number;
  severity: PotholeSeverity;
  score: number;
}

/** Meter 2: the boxes of the latest detection, biggest first, and the number of each severity. */
export interface SizeSummary {
  boxes: SizeReading[];
  counts: Record<PotholeSeverity, number>;
  /** The average share of the picture covered by the boxes, or null when there are none. */
  averageRatio: number | null;
}

export interface MeterReading {
  performance: PerformanceReading;
  size: SizeSummary;
}

export interface Meters {
  record(result: DetectionResult, nowMs: number): MeterReading;
  reset(): void;
}

function summarizeSizes(result: DetectionResult): SizeSummary {
  const boxes = result.detections
    .map((found) => {
      const ratio = sizeRatio(found, result.frame);
      return { ratio, severity: severityOf(ratio), score: found.score };
    })
    .sort((a, b) => b.ratio - a.ratio);
  const counts: Record<PotholeSeverity, number> = { leve: 0, moderado: 0, grave: 0 };
  for (const box of boxes) counts[box.severity] += 1;
  return { boxes, counts, averageRatio: mean(boxes.map((box) => box.ratio)) };
}

/** Keeps the last measurements of the camera and turns them into what the two meters show. */
export function createMeters(window: number = METER_WINDOW): Meters {
  const moments = new RingBuffer<number>(window);
  const inference = new RingBuffer<number>(window);
  const total = new RingBuffer<number>(window);

  return {
    record(result, nowMs) {
      moments.push(nowMs);
      inference.push(result.timings.inferenceMs);
      total.push(result.timings.totalMs);
      return {
        performance: {
          fps: ratePerSecond(moments.toArray()),
          inferenceMs: median(inference.toArray()),
          totalMs: median(total.toArray()),
        },
        size: summarizeSizes(result),
      };
    },
    reset() {
      moments.clear();
      inference.clear();
      total.clear();
    },
  };
}
