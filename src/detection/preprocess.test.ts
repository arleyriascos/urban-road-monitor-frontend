import { describe, expect, it } from 'vitest';
import { PADDING_GRAY, rgbaToModelInput } from './preprocess';

describe('rgbaToModelInput', () => {
  it('puts the red, green and blue values in separate planes', () => {
    // A 2x2 picture: red, green, blue and white pixels.
    const rgba = new Uint8ClampedArray([
      255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255,
    ]);
    const input = rgbaToModelInput(rgba, 2);
    expect(Array.from(input.slice(0, 4))).toEqual([1, 0, 0, 1]); // red plane
    expect(Array.from(input.slice(4, 8))).toEqual([0, 1, 0, 1]); // green plane
    expect(Array.from(input.slice(8, 12))).toEqual([0, 0, 1, 1]); // blue plane
  });

  it('scales the values from 0-255 to 0-1', () => {
    const rgba = new Uint8ClampedArray([51, 102, 204, 255]);
    const input = rgbaToModelInput(rgba, 1);
    expect(input[0]).toBeCloseTo(0.2);
    expect(input[1]).toBeCloseTo(0.4);
    expect(input[2]).toBeCloseTo(0.8);
  });

  it('ignores the alpha channel', () => {
    const opaque = rgbaToModelInput(new Uint8ClampedArray([10, 20, 30, 255]), 1);
    const clear = rgbaToModelInput(new Uint8ClampedArray([10, 20, 30, 0]), 1);
    expect(Array.from(clear)).toEqual(Array.from(opaque));
  });

  it('has three values for every pixel', () => {
    expect(rgbaToModelInput(new Uint8ClampedArray(416 * 416 * 4), 416)).toHaveLength(3 * 416 * 416);
  });

  it('refuses pixels that do not match the side', () => {
    expect(() => rgbaToModelInput(new Uint8ClampedArray(10), 2)).toThrow(RangeError);
  });

  it('uses the gray of the training for the padding', () => {
    expect(PADDING_GRAY).toBe(114);
  });
});
