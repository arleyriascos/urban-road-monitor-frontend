import { describe, expect, it } from 'vitest';
import { sizeRatio } from './size';

const FRAME = { width: 1000, height: 500 };

describe('sizeRatio', () => {
  it('is the share of the picture that the box covers', () => {
    expect(sizeRatio({ x: 0, y: 0, width: 100, height: 50 }, FRAME)).toBeCloseTo(0.01);
  });

  it('is 1 for a box as big as the picture', () => {
    expect(sizeRatio({ x: 0, y: 0, ...FRAME }, FRAME)).toBe(1);
  });

  it('never goes above 1', () => {
    expect(sizeRatio({ x: 0, y: 0, width: 5000, height: 5000 }, FRAME)).toBe(1);
  });

  it('is 0 for an empty box or an empty picture', () => {
    expect(sizeRatio({ x: 0, y: 0, width: 0, height: 20 }, FRAME)).toBe(0);
    expect(sizeRatio({ x: 0, y: 0, width: 10, height: 10 }, { width: 0, height: 0 })).toBe(0);
  });
});
