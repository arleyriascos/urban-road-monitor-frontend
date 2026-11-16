import { clampBox } from './box';
import type { Letterbox } from './letterbox';
import type { Detection, FrameSize } from './types';

/**
 * A detection is found in the square the model looked at. This brings it back to the pixels
 * of the original picture: it takes away the padding, undoes the scaling and cuts what falls
 * outside the picture.
 */
export function toFrameCoordinates(
  detection: Detection,
  letterbox: Letterbox,
  frame: FrameSize,
): Detection {
  const box = clampBox(
    {
      x: (detection.x - letterbox.padX) / letterbox.scale,
      y: (detection.y - letterbox.padY) / letterbox.scale,
      width: detection.width / letterbox.scale,
      height: detection.height / letterbox.scale,
    },
    frame,
  );
  return { ...box, score: detection.score };
}
