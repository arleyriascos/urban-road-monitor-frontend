import { describe, expect, it } from 'vitest';
import { computeLetterbox } from './letterbox';

describe('computeLetterbox', () => {
  it('pads above and below a wide picture', () => {
    // 1280x720 in 416x416: scale 0.325, content 416x234, 182 empty rows split in two.
    const letterbox = computeLetterbox({ width: 1280, height: 720 }, 416);
    expect(letterbox.scale).toBeCloseTo(0.325);
    expect(letterbox.width).toBe(416);
    expect(letterbox.height).toBe(234);
    expect(letterbox.padX).toBe(0);
    expect(letterbox.padY).toBe(91);
  });

  it('pads on the sides of a tall picture', () => {
    const letterbox = computeLetterbox({ width: 720, height: 1280 }, 416);
    expect(letterbox.width).toBe(234);
    expect(letterbox.height).toBe(416);
    expect(letterbox.padX).toBe(91);
    expect(letterbox.padY).toBe(0);
  });

  it('does not pad a square picture', () => {
    const letterbox = computeLetterbox({ width: 800, height: 800 }, 416);
    expect(letterbox).toMatchObject({ width: 416, height: 416, padX: 0, padY: 0 });
  });

  it('also scales a picture smaller than the square up', () => {
    const letterbox = computeLetterbox({ width: 208, height: 104 }, 416);
    expect(letterbox.scale).toBe(2);
    expect(letterbox.width).toBe(416);
    expect(letterbox.height).toBe(208);
  });

  it('always fits inside the square', () => {
    for (const [width, height] of [
      [640, 480],
      [1920, 1080],
      [1080, 1920],
      [333, 777],
    ]) {
      const letterbox = computeLetterbox({ width, height }, 416);
      expect(letterbox.padX * 2 + letterbox.width).toBeLessThanOrEqual(416);
      expect(letterbox.padY * 2 + letterbox.height).toBeLessThanOrEqual(416);
      expect(Math.max(letterbox.width, letterbox.height)).toBe(416);
    }
  });

  it('refuses a picture or a square with no size', () => {
    expect(() => computeLetterbox({ width: 0, height: 10 }, 416)).toThrow(RangeError);
    expect(() => computeLetterbox({ width: 10, height: 10 }, 0)).toThrow(RangeError);
  });
});
