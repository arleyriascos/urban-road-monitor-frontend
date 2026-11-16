import { describe, expect, it } from 'vitest';
import { decodeModelOutput } from './decode';

/** Builds the five rows for the given candidates: [centerX, centerY, width, height, score]. */
function outputOf(candidates: number[][]): Float32Array {
  const output = new Float32Array(5 * candidates.length);
  candidates.forEach((values, candidate) => {
    values.forEach((value, row) => {
      output[row * candidates.length + candidate] = value;
    });
  });
  return output;
}

describe('decodeModelOutput', () => {
  it('turns the center and size of a candidate into a corner and a size', () => {
    const output = outputOf([[100, 200, 40, 20, 0.9]]);
    const [found] = decodeModelOutput(output, 1, 0.4);
    expect(found.x).toBeCloseTo(80);
    expect(found.y).toBeCloseTo(190);
    expect(found.width).toBeCloseTo(40);
    expect(found.height).toBeCloseTo(20);
    expect(found.score).toBeCloseTo(0.9);
  });

  it('keeps only the candidates at or above the threshold', () => {
    const output = outputOf([
      [10, 10, 4, 4, 0.2],
      [50, 50, 8, 8, 0.4],
      [90, 90, 6, 6, 0.95],
    ]);
    const found = decodeModelOutput(output, 3, 0.4);
    expect(found.map((d) => Math.round(d.score * 100))).toEqual([40, 95]);
  });

  it('finds nothing when no candidate is sure enough', () => {
    expect(decodeModelOutput(outputOf([[1, 1, 1, 1, 0.1]]), 1, 0.4)).toEqual([]);
  });

  it('ignores a score that is not a number', () => {
    expect(decodeModelOutput(outputOf([[1, 1, 1, 1, Number.NaN]]), 1, 0.4)).toEqual([]);
  });

  it('reads the real size of the output: 3549 candidates', () => {
    const output = new Float32Array(5 * 3549);
    output[4 * 3549 + 3000] = 0.8;
    output[3000] = 208;
    output[3549 + 3000] = 208;
    output[2 * 3549 + 3000] = 30;
    output[3 * 3549 + 3000] = 30;
    const found = decodeModelOutput(output, 3549, 0.4);
    expect(found).toHaveLength(1);
    expect(found[0].x).toBeCloseTo(193);
  });

  it('refuses an output of an unexpected size', () => {
    expect(() => decodeModelOutput(new Float32Array(7), 3, 0.4)).toThrow(RangeError);
  });
});
