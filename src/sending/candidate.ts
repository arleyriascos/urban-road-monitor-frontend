import { boxArea } from '../detection/box';
import type { Detection, FrameSize } from '../detection/types';
import type { DetectionPayload, TripRules } from '../types/trips';
import { distanceBetween, type GpsFix } from './geo';

/** The part of the rules the phone checks before it saves a detection. */
export type SendRules = Pick<TripRules['model'], 'minConfidence'> &
  Pick<TripRules['limits'], 'maxGpsAccuracyM'>;

/** What is asked of the phone before it keeps a detection, so the server never has to refuse it. */
export const DEFAULT_RULES: SendRules = { minConfidence: 0.4, maxGpsAccuracyM: 20 };

/** The share of the picture that the box covers, from 0 to 1. */
export function areaRatio(detection: Detection, frame: FrameSize): number {
  const total = frame.width * frame.height;
  if (total <= 0) return 0;
  return Math.min(1, boxArea(detection) / total);
}

/**
 * Turns what the camera saw into what is sent: the position is where the phone is (the
 * camera looks at the road just ahead), and the severity is not sent because the server
 * works it out. Returns null when the server would refuse it anyway: too little confidence,
 * a GPS that is not accurate enough, or a box with no area.
 */
export function toPayload(
  detection: Detection,
  frame: FrameSize,
  fix: GpsFix,
  rules: SendRules,
  id: string,
  detectedAt: Date,
): DetectionPayload | null {
  if (detection.score < rules.minConfidence) return null;
  if (fix.accuracyM > rules.maxGpsAccuracyM) return null;
  const ratio = areaRatio(detection, frame);
  if (ratio <= 0) return null;
  return {
    id,
    latitude: fix.latitude,
    longitude: fix.longitude,
    gpsAccuracyM: fix.accuracyM,
    confidence: Math.min(1, detection.score),
    bboxAreaRatio: ratio,
    detectedAt: detectedAt.toISOString(),
  };
}

/** The same pothole shows in many pictures in a row: one detection of a place is enough. */
export const REPEAT_RADIUS_M = 6;
export const REPEAT_WINDOW_MS = 8_000;

export interface RepeatFilter {
  /** True when this position is new; false when a detection was kept just here a moment ago. */
  accept(point: { latitude: number; longitude: number }, timeMs: number): boolean;
}

export function createRepeatFilter(
  radiusM: number = REPEAT_RADIUS_M,
  windowMs: number = REPEAT_WINDOW_MS,
): RepeatFilter {
  let recent: { latitude: number; longitude: number; timeMs: number }[] = [];
  return {
    accept(point, timeMs) {
      recent = recent.filter((entry) => timeMs - entry.timeMs < windowMs);
      if (recent.some((entry) => distanceBetween(entry, point) < radiusM)) return false;
      recent.push({ latitude: point.latitude, longitude: point.longitude, timeMs });
      return true;
    },
  };
}
