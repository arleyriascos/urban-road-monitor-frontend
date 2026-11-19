import { describe, expect, it } from 'vitest';
import { formatDuration } from './duration';

describe('formatDuration', () => {
  it.each([
    [0, '0 ms'],
    [120.4, '120 ms'],
    [999, '999 ms'],
    [1000, '1,0 s'],
    [1840, '1,8 s'],
  ])('%d ms is %s', (ms, text) => {
    expect(formatDuration(ms)).toBe(text);
  });
});

describe('formatDuration in English', () => {
  it.each([
    [120.4, '120 ms'],
    [1840, '1.8 s'],
  ])('%d ms is %s', (ms, text) => {
    expect(formatDuration(ms, 'en')).toBe(text);
  });
});
