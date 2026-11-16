import { intersectionOverUnion } from './iou';
import type { Detection } from './types';

/**
 * Non-maximum suppression: the model proposes many boxes around the same pothole. Going from
 * the surest to the least sure, a box stays only if it does not overlap (more than the
 * threshold) with a box that already stayed. `limit` caps how many boxes are kept.
 */
export function nonMaxSuppression(
  detections: readonly Detection[],
  iouThreshold: number,
  limit = Number.POSITIVE_INFINITY,
): Detection[] {
  const byScore = [...detections].sort((a, b) => b.score - a.score);
  const kept: Detection[] = [];
  for (const candidate of byScore) {
    if (kept.length >= limit) break;
    const repeated = kept.some((other) => intersectionOverUnion(candidate, other) > iouThreshold);
    if (!repeated) kept.push(candidate);
  }
  return kept;
}
