import { describe, expect, it } from 'vitest';
import { intersectionOverUnion } from './iou';

const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height });

describe('intersectionOverUnion', () => {
  it('is 1 for the same box', () => {
    expect(intersectionOverUnion(box(0, 0, 10, 10), box(0, 0, 10, 10))).toBe(1);
  });

  it('is 0 for boxes that do not touch', () => {
    expect(intersectionOverUnion(box(0, 0, 10, 10), box(20, 20, 5, 5))).toBe(0);
  });

  it('is 0 for boxes that only share an edge', () => {
    expect(intersectionOverUnion(box(0, 0, 10, 10), box(10, 0, 10, 10))).toBe(0);
  });

  it('divides the shared area by the area of both together', () => {
    // 10x10 and 10x10 shifted by 5: they share 5x10 = 50 and cover 100 + 100 - 50 = 150.
    expect(intersectionOverUnion(box(0, 0, 10, 10), box(5, 0, 10, 10))).toBeCloseTo(50 / 150);
  });

  it('is the area ratio when one box is inside the other', () => {
    expect(intersectionOverUnion(box(0, 0, 10, 10), box(2, 2, 5, 5))).toBeCloseTo(25 / 100);
  });

  it('does not depend on the order of the boxes', () => {
    const a = box(3, 4, 12, 7);
    const b = box(8, 1, 9, 15);
    expect(intersectionOverUnion(a, b)).toBe(intersectionOverUnion(b, a));
  });

  it('is 0 when both boxes are empty', () => {
    expect(intersectionOverUnion(box(1, 1, 0, 0), box(1, 1, 0, 0))).toBe(0);
  });
});
