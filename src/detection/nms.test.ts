import { describe, expect, it } from 'vitest';
import { intersectionOverUnion } from './iou';
import { nonMaxSuppression } from './nms';
import type { Detection } from './types';

const det = (x: number, y: number, size: number, score: number): Detection => ({
  x,
  y,
  width: size,
  height: size,
  score,
});

describe('nonMaxSuppression', () => {
  it('keeps nothing when there is nothing', () => {
    expect(nonMaxSuppression([], 0.5)).toEqual([]);
  });

  it('keeps only the surest of two boxes on the same pothole', () => {
    const kept = nonMaxSuppression([det(0, 0, 10, 0.6), det(1, 1, 10, 0.9)], 0.5);
    expect(kept).toEqual([det(1, 1, 10, 0.9)]);
  });

  it('keeps boxes that are apart', () => {
    const kept = nonMaxSuppression([det(0, 0, 10, 0.6), det(50, 50, 10, 0.9)], 0.5);
    expect(kept.map((d) => d.score)).toEqual([0.9, 0.6]);
  });

  it('keeps boxes that overlap less than the threshold', () => {
    // Shifted by half a box: the overlap is 1/3, below 0.5.
    const kept = nonMaxSuppression([det(0, 0, 10, 0.9), det(5, 0, 10, 0.8)], 0.5);
    expect(kept).toHaveLength(2);
  });

  it('does not change the list it receives', () => {
    const input = [det(0, 0, 10, 0.5), det(1, 1, 10, 0.9)];
    const copy = input.map((d) => ({ ...d }));
    nonMaxSuppression(input, 0.5);
    expect(input).toEqual(copy);
  });

  it('stops at the limit, keeping the surest ones', () => {
    const many = [0, 1, 2, 3, 4].map((i) => det(i * 100, 0, 10, 0.5 + i / 10));
    const kept = nonMaxSuppression(many, 0.5, 2);
    expect(kept.map((d) => d.score)).toEqual([0.9, 0.8]);
  });

  it('never keeps two boxes that overlap more than the threshold (random boxes)', () => {
    let seed = 12345;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let round = 0; round < 40; round++) {
      const boxes = Array.from({ length: 30 }, () =>
        det(random() * 100, random() * 100, 5 + random() * 40, random()),
      );
      const kept = nonMaxSuppression(boxes, 0.4);
      for (let i = 0; i < kept.length; i++) {
        for (let j = i + 1; j < kept.length; j++) {
          expect(intersectionOverUnion(kept[i], kept[j])).toBeLessThanOrEqual(0.4);
        }
      }
      // The surest box of all always stays.
      const best = boxes.reduce((a, b) => (b.score > a.score ? b : a));
      expect(kept[0]).toEqual(best);
    }
  });
});
