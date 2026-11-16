import { describe, expect, it } from 'vitest';
import { toFrameCoordinates } from './frame-coordinates';
import { computeLetterbox } from './letterbox';

const FRAME = { width: 1280, height: 720 };
const letterbox = computeLetterbox(FRAME, 416); // scale 0.325, padY 91

describe('toFrameCoordinates', () => {
  it('takes away the padding and undoes the scaling', () => {
    // A box at (32.5, 123.5) of size 65x32.5 in the square is (100, 100) of size 200x100 in the frame.
    const back = toFrameCoordinates(
      { x: 32.5, y: 91 + 32.5, width: 65, height: 32.5, score: 0.8 },
      letterbox,
      FRAME,
    );
    expect(back.x).toBeCloseTo(100);
    expect(back.y).toBeCloseTo(100);
    expect(back.width).toBeCloseTo(200);
    expect(back.height).toBeCloseTo(100);
    expect(back.score).toBe(0.8);
  });

  it('cuts the part that falls in the padding or outside the frame', () => {
    const back = toFrameCoordinates(
      { x: -20, y: 0, width: 100, height: 120, score: 0.5 },
      letterbox,
      FRAME,
    );
    expect(back.x).toBe(0);
    expect(back.y).toBe(0);
    expect(back.x + back.width).toBeLessThanOrEqual(FRAME.width);
    expect(back.y + back.height).toBeLessThanOrEqual(FRAME.height);
  });

  it('is the identity for a square frame of the size of the model', () => {
    const square = { width: 416, height: 416 };
    const same = toFrameCoordinates(
      { x: 10, y: 20, width: 30, height: 40, score: 0.7 },
      computeLetterbox(square, 416),
      square,
    );
    expect(same).toEqual({ x: 10, y: 20, width: 30, height: 40, score: 0.7 });
  });
});
