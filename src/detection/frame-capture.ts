import { computeLetterbox, type Letterbox } from './letterbox';
import { MODEL_INPUT_SIZE } from './model-info';
import { PADDING_GRAY } from './preprocess';
import type { FrameSize } from './types';

/** A frame ready for the model: its pixels as RGBA and how it was fitted in the square. */
export interface CapturedFrame {
  rgba: Uint8ClampedArray;
  letterbox: Letterbox;
}

/** The part of a 2D canvas that the capture uses. */
export interface CaptureContext {
  fillStyle: string | CanvasGradient | CanvasPattern;
  fillRect(x: number, y: number, width: number, height: number): void;
  drawImage(image: CanvasImageSource, x: number, y: number, width: number, height: number): void;
  getImageData(x: number, y: number, width: number, height: number): { data: Uint8ClampedArray };
}

export interface FrameCapturer {
  /** Draws the picture in the square (gray around it) and reads its pixels. */
  capture(source: CanvasImageSource, frame: FrameSize): CapturedFrame;
}

function defaultContext(side: number): CaptureContext {
  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('This browser cannot read the pixels of the camera');
  return context;
}

/**
 * Makes the capturer that turns each frame of the video into the square the model reads.
 * It reuses one canvas for every frame, so there is no new memory to clean up each time.
 */
export function createFrameCapturer(
  side: number = MODEL_INPUT_SIZE,
  makeContext: (side: number) => CaptureContext = defaultContext,
): FrameCapturer {
  const context = makeContext(side);
  return {
    capture(source, frame) {
      const letterbox = computeLetterbox(frame, side);
      context.fillStyle = `rgb(${PADDING_GRAY}, ${PADDING_GRAY}, ${PADDING_GRAY})`;
      context.fillRect(0, 0, side, side);
      context.drawImage(source, letterbox.padX, letterbox.padY, letterbox.width, letterbox.height);
      return { rgba: context.getImageData(0, 0, side, side).data, letterbox };
    },
  };
}
