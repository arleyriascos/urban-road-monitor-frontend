import { boxArea } from './box';
import type { Box, FrameSize } from './types';

/**
 * How much of the picture the box covers, from 0 to 1. It is the "size" of a pothole that
 * the app measures: the camera does not know the distance, so the size is relative to the
 * picture, not in centimeters.
 */
export function sizeRatio(box: Box, frame: FrameSize): number {
  const frameArea = boxArea({ x: 0, y: 0, ...frame });
  if (frameArea <= 0) return 0;
  return Math.min(1, boxArea(box) / frameArea);
}
