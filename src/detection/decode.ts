import { MODEL_OUTPUT_ROWS } from './model-info';
import type { Detection } from './types';

/**
 * Reads the output of the model. The numbers come as five rows of `candidates` values each:
 * the center x, the center y, the width, the height and the score of every candidate. Only the
 * candidates with a score at or above `threshold` are returned, as boxes (top-left corner and
 * size) in the pixels of the square the model looked at.
 */
export function decodeModelOutput(
  output: ArrayLike<number>,
  candidates: number,
  threshold: number,
): Detection[] {
  if (output.length !== MODEL_OUTPUT_ROWS * candidates) {
    throw new RangeError(
      `Expected ${MODEL_OUTPUT_ROWS * candidates} numbers but the model gave ${output.length}`,
    );
  }
  const found: Detection[] = [];
  for (let candidate = 0; candidate < candidates; candidate++) {
    const score = output[4 * candidates + candidate];
    if (!(score >= threshold)) continue;
    const centerX = output[candidate];
    const centerY = output[candidates + candidate];
    const width = output[2 * candidates + candidate];
    const height = output[3 * candidates + candidate];
    found.push({ x: centerX - width / 2, y: centerY - height / 2, width, height, score });
  }
  return found;
}
