import { describe, expect, it } from 'vitest';
import { mean, median, ratePerSecond } from './stats';

describe('median', () => {
  it('is null for an empty list', () => {
    expect(median([])).toBeNull();
  });

  it('takes the middle value of an odd list, whatever the order', () => {
    expect(median([9, 1, 5])).toBe(5);
  });

  it('averages the two middle values of an even list', () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it('is not moved by one extreme value', () => {
    expect(median([100, 102, 98, 101, 5000])).toBe(101);
  });

  it('does not change the list it receives', () => {
    const values = [3, 1, 2];
    median(values);
    expect(values).toEqual([3, 1, 2]);
  });
});

describe('mean', () => {
  it('is null for an empty list', () => {
    expect(mean([])).toBeNull();
  });

  it('adds up and divides', () => {
    expect(mean([1, 2, 6])).toBe(3);
  });
});

describe('ratePerSecond', () => {
  it('needs two moments', () => {
    expect(ratePerSecond([])).toBeNull();
    expect(ratePerSecond([1000])).toBeNull();
  });

  it('counts the gaps between the moments', () => {
    // Four moments 500 ms apart: 3 gaps in 1.5 s = 2 per second.
    expect(ratePerSecond([0, 500, 1000, 1500])).toBe(2);
  });

  it('is null when no time went by', () => {
    expect(ratePerSecond([800, 800])).toBeNull();
  });
});
