import { describe, expect, it } from 'vitest';
import { boxArea, clampBox } from './box';

describe('boxArea', () => {
  it('multiplies the width by the height', () => {
    expect(boxArea({ x: 10, y: 10, width: 4, height: 5 })).toBe(20);
  });

  it('is zero when a side has no length or is negative', () => {
    expect(boxArea({ x: 0, y: 0, width: 0, height: 9 })).toBe(0);
    expect(boxArea({ x: 0, y: 0, width: -3, height: 9 })).toBe(0);
  });
});

describe('clampBox', () => {
  const frame = { width: 100, height: 50 };

  it('leaves a box that is inside the frame as it is', () => {
    const box = { x: 10, y: 5, width: 20, height: 10 };
    expect(clampBox(box, frame)).toEqual(box);
  });

  it('cuts the part that sticks out on any side', () => {
    expect(clampBox({ x: -10, y: -5, width: 30, height: 20 }, frame)).toEqual({
      x: 0,
      y: 0,
      width: 20,
      height: 15,
    });
    expect(clampBox({ x: 90, y: 40, width: 30, height: 30 }, frame)).toEqual({
      x: 90,
      y: 40,
      width: 10,
      height: 10,
    });
  });

  it('gives an empty box when the box is fully outside', () => {
    const clamped = clampBox({ x: 200, y: 200, width: 10, height: 10 }, frame);
    expect(boxArea(clamped)).toBe(0);
    expect(clamped.x).toBeLessThanOrEqual(frame.width);
  });
});
