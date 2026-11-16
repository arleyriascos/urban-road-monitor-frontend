import { describe, expect, it } from 'vitest';
import { RingBuffer } from './ring-buffer';

describe('RingBuffer', () => {
  it('starts empty', () => {
    const buffer = new RingBuffer<number>(3);
    expect(buffer.size).toBe(0);
    expect(buffer.toArray()).toEqual([]);
    expect(buffer.newest()).toBeUndefined();
  });

  it('keeps the values in the order they came while it has room', () => {
    const buffer = new RingBuffer<number>(3);
    buffer.push(1);
    buffer.push(2);
    expect(buffer.toArray()).toEqual([1, 2]);
    expect(buffer.size).toBe(2);
    expect(buffer.newest()).toBe(2);
  });

  it('drops the oldest value when it is full', () => {
    const buffer = new RingBuffer<number>(3);
    [1, 2, 3, 4, 5].forEach((value) => buffer.push(value));
    expect(buffer.toArray()).toEqual([3, 4, 5]);
    expect(buffer.size).toBe(3);
    expect(buffer.newest()).toBe(5);
  });

  it('can be emptied and used again', () => {
    const buffer = new RingBuffer<string>(2);
    buffer.push('a');
    buffer.push('b');
    buffer.clear();
    expect(buffer.toArray()).toEqual([]);
    buffer.push('c');
    expect(buffer.toArray()).toEqual(['c']);
  });

  it('works with a capacity of 1', () => {
    const buffer = new RingBuffer<number>(1);
    buffer.push(7);
    buffer.push(8);
    expect(buffer.toArray()).toEqual([8]);
  });

  it('refuses a capacity that is not a whole number above zero', () => {
    expect(() => new RingBuffer(0)).toThrow(RangeError);
    expect(() => new RingBuffer(2.5)).toThrow(RangeError);
  });

  it('matches a plain list that keeps its last items (random pushes)', () => {
    const buffer = new RingBuffer<number>(5);
    const reference: number[] = [];
    for (let i = 0; i < 100; i++) {
      const value = (i * 37) % 11;
      buffer.push(value);
      reference.push(value);
      expect(buffer.toArray()).toEqual(reference.slice(-5));
    }
  });
});
