import type { FrameSize } from './types';

/**
 * How a picture of any shape fits in the square the model looks at, without stretching it:
 * the picture is scaled until its longer side fills the square and the rest is padded.
 */
export interface Letterbox {
  /** Pixels of the square per pixel of the original picture. */
  scale: number;
  /** The size of the picture once scaled (one of the two equals the square). */
  width: number;
  height: number;
  /** The empty space left on the left and on the top. */
  padX: number;
  padY: number;
}

/** The letterbox of a picture of the given size in a square of `side` pixels. */
export function computeLetterbox(frame: FrameSize, side: number): Letterbox {
  if (frame.width <= 0 || frame.height <= 0 || side <= 0) {
    throw new RangeError('The picture and the square need a size above zero');
  }
  const scale = Math.min(side / frame.width, side / frame.height);
  const width = Math.round(frame.width * scale);
  const height = Math.round(frame.height * scale);
  return {
    scale,
    width,
    height,
    padX: Math.floor((side - width) / 2),
    padY: Math.floor((side - height) / 2),
  };
}
