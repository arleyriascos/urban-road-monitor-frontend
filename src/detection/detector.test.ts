import { describe, expect, it, vi } from 'vitest';
import { createDetector } from './detector';
import type { FrameCapturer } from './frame-capture';
import { computeLetterbox } from './letterbox';
import { MODEL_CANDIDATES, MODEL_INPUT_SIZE } from './model-info';
import type { ModelSession } from './model-session';

const FRAME = { width: 1280, height: 720 };

/** The output of the model with these candidates: [centerX, centerY, width, height, score]. */
function modelOutput(candidates: number[][]): Float32Array {
  const output = new Float32Array(5 * MODEL_CANDIDATES);
  candidates.forEach((values, candidate) => {
    values.forEach((value, row) => {
      output[row * MODEL_CANDIDATES + candidate] = value;
    });
  });
  return output;
}

function makeDetector(output: Float32Array, clock: number[] = [0, 5, 45, 50]) {
  const capturer: FrameCapturer = {
    capture: vi.fn(() => ({
      rgba: new Uint8ClampedArray(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 4),
      letterbox: computeLetterbox(FRAME, MODEL_INPUT_SIZE),
    })),
  };
  const session: ModelSession = {
    run: vi.fn(async () => output),
    release: vi.fn(async () => undefined),
  };
  let step = 0;
  const detector = createDetector(session, capturer, () => clock[step++] ?? 0);
  return { detector, session, capturer };
}

describe('createDetector', () => {
  it('finds a pothole and gives it in the pixels of the frame', async () => {
    // A box centered at (208, 208) of size 65x32.5 in the square: in the 1280x720 frame it is
    // centered at (640, 360) with size 200x100, so its corner is at (540, 310).
    const { detector } = makeDetector(modelOutput([[208, 208, 65, 32.5, 0.9]]));

    const result = await detector.detect({} as CanvasImageSource, FRAME);

    expect(result.detections).toHaveLength(1);
    const [found] = result.detections;
    expect(found.x).toBeCloseTo(540);
    expect(found.y).toBeCloseTo(310);
    expect(found.width).toBeCloseTo(200);
    expect(found.height).toBeCloseTo(100);
    expect(found.score).toBeCloseTo(0.9);
    expect(result.frame).toEqual(FRAME);
  });

  it('finds nothing when no candidate is sure enough', async () => {
    const { detector } = makeDetector(modelOutput([[208, 208, 65, 32.5, 0.1]]));
    const result = await detector.detect({} as CanvasImageSource, FRAME);
    expect(result.detections).toEqual([]);
  });

  it('keeps one box for a pothole the model proposes twice', async () => {
    const { detector } = makeDetector(
      modelOutput([
        [208, 208, 65, 32.5, 0.9],
        [210, 209, 66, 33, 0.7],
      ]),
    );
    const result = await detector.detect({} as CanvasImageSource, FRAME);
    expect(result.detections).toHaveLength(1);
    expect(result.detections[0].score).toBeCloseTo(0.9);
  });

  it('drops a box that falls entirely in the gray padding', async () => {
    // Row 20 of the square is above the picture (the padding is 91 rows tall).
    const { detector } = makeDetector(modelOutput([[208, 20, 40, 20, 0.9]]));
    const result = await detector.detect({} as CanvasImageSource, FRAME);
    expect(result.detections).toEqual([]);
  });

  it('gives the model the pixels of the capture and the capture the source and the size', async () => {
    const { detector, session, capturer } = makeDetector(modelOutput([]));
    const source = {} as CanvasImageSource;

    await detector.detect(source, FRAME);

    expect(capturer.capture).toHaveBeenCalledWith(source, FRAME);
    const input = vi.mocked(session.run).mock.calls[0][0];
    expect(input).toHaveLength(3 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE);
  });

  it('times the capture, the model and the whole process', async () => {
    const { detector } = makeDetector(modelOutput([]), [100, 105, 145, 150]);
    const { timings } = await detector.detect({} as CanvasImageSource, FRAME);
    expect(timings).toEqual({ captureMs: 5, inferenceMs: 40, totalMs: 50 });
  });

  it('fails when the model fails', async () => {
    const { detector, session } = makeDetector(modelOutput([]));
    vi.mocked(session.run).mockRejectedValueOnce(new Error('boom'));
    await expect(detector.detect({} as CanvasImageSource, FRAME)).rejects.toThrow('boom');
  });
});
