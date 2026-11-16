import { describe, expect, it } from 'vitest';
import { formatCoverage } from './coverage';

describe('formatCoverage', () => {
  it.each([
    [0.004, '0,4 %'],
    [0.0449, '4,5 %'],
    [0.125, '13 %'],
    [1, '100 %'],
  ])('%d is %s', (ratio, text) => {
    expect(formatCoverage(ratio)).toBe(text);
  });
});
