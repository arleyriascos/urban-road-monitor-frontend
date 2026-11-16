import type { Box, FrameSize } from './types';

/** The area of a box in square pixels; a box with no width or height has none. */
export function boxArea(box: Box): number {
  return Math.max(0, box.width) * Math.max(0, box.height);
}

/** The part of the box that lies inside the frame (it may become empty). */
export function clampBox(box: Box, frame: FrameSize): Box {
  const left = Math.min(Math.max(box.x, 0), frame.width);
  const top = Math.min(Math.max(box.y, 0), frame.height);
  const right = Math.min(Math.max(box.x + box.width, 0), frame.width);
  const bottom = Math.min(Math.max(box.y + box.height, 0), frame.height);
  return { x: left, y: top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}
