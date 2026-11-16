import { boxArea } from './box';
import { decodeModelOutput } from './decode';
import type { FrameCapturer } from './frame-capture';
import { toFrameCoordinates } from './frame-coordinates';
import {
  MAX_DETECTIONS,
  MODEL_CANDIDATES,
  MODEL_INPUT_SIZE,
  NMS_IOU_THRESHOLD,
  SCORE_THRESHOLD,
} from './model-info';
import type { ModelSession } from './model-session';
import { nonMaxSuppression } from './nms';
import { rgbaToModelInput } from './preprocess';
import type { Detection, FrameSize } from './types';

/** How long each part of one detection took, in milliseconds. */
export interface DetectionTimings {
  captureMs: number;
  inferenceMs: number;
  totalMs: number;
}

export interface DetectionResult {
  /** The potholes, in the pixels of the picture that was analyzed. */
  detections: Detection[];
  /** The size of that picture. */
  frame: FrameSize;
  timings: DetectionTimings;
}

export interface Detector {
  detect(source: CanvasImageSource, frame: FrameSize): Promise<DetectionResult>;
}

/**
 * Puts the whole process together: fit the frame in the square, run the model, read the
 * output, keep the surest box of each pothole and bring the boxes back to the frame.
 */
export function createDetector(
  session: ModelSession,
  capturer: FrameCapturer,
  now: () => number = () => performance.now(),
): Detector {
  return {
    async detect(source, frame) {
      const begin = now();
      const { rgba, letterbox } = capturer.capture(source, frame);
      const input = rgbaToModelInput(rgba, MODEL_INPUT_SIZE);
      const captured = now();

      const output = await session.run(input);
      const inferred = now();

      const candidates = decodeModelOutput(output, MODEL_CANDIDATES, SCORE_THRESHOLD);
      const detections = nonMaxSuppression(candidates, NMS_IOU_THRESHOLD, MAX_DETECTIONS)
        .map((found) => toFrameCoordinates(found, letterbox, frame))
        .filter((found) => boxArea(found) > 0);

      return {
        detections,
        frame,
        timings: {
          captureMs: captured - begin,
          inferenceMs: inferred - captured,
          totalMs: now() - begin,
        },
      };
    },
  };
}
