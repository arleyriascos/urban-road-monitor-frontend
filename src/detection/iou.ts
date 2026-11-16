import { boxArea } from './box';
import type { Box } from './types';

/**
 * How much two boxes overlap: the area they share divided by the area they cover together.
 * 0 means they do not touch and 1 means they are the same box.
 */
export function intersectionOverUnion(a: Box, b: Box): number {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  const shared = Math.max(0, right - left) * Math.max(0, bottom - top);
  const union = boxArea(a) + boxArea(b) - shared;
  return union <= 0 ? 0 : shared / union;
}
