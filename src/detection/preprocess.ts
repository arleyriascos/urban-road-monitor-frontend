/** The gray that fills the empty space around the picture (the one the model was trained with). */
export const PADDING_GRAY = 114;

/**
 * Turns the pixels of a square picture into the numbers the model reads: three planes (red,
 * then green, then blue), each pixel from 0 to 1. The canvas gives the pixels as RGBA, one
 * after the other; the model wants them by color. The alpha channel is dropped.
 */
export function rgbaToModelInput(rgba: Uint8ClampedArray, side: number): Float32Array {
  const pixels = side * side;
  if (rgba.length !== pixels * 4) {
    throw new RangeError(`Expected ${pixels * 4} bytes for a ${side}x${side} picture`);
  }
  const input = new Float32Array(pixels * 3);
  for (let pixel = 0; pixel < pixels; pixel++) {
    const from = pixel * 4;
    input[pixel] = rgba[from] / 255;
    input[pixels + pixel] = rgba[from + 1] / 255;
    input[2 * pixels + pixel] = rgba[from + 2] / 255;
  }
  return input;
}
