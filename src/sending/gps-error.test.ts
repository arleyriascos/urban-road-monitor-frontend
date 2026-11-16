import { describe, expect, it } from 'vitest';
import { classifyGpsError, describeGpsProblem } from './gps-error';

describe('classifyGpsError', () => {
  it('knows a refused permission', () => {
    expect(classifyGpsError({ code: 1 })).toBe('denied');
  });

  it('calls everything else unavailable', () => {
    expect(classifyGpsError({ code: 2 })).toBe('unavailable');
    expect(classifyGpsError({ code: 3 })).toBe('unavailable');
    expect(classifyGpsError(null)).toBe('unavailable');
    expect(classifyGpsError({})).toBe('unavailable');
  });
});

describe('describeGpsProblem', () => {
  it('says something different and useful for each problem', () => {
    const texts = (['denied', 'unavailable', 'unsupported'] as const).map(describeGpsProblem);
    expect(new Set(texts).size).toBe(3);
    expect(texts[0]).toMatch(/permiso/);
    expect(texts[1]).toMatch(/ubicar/);
    expect(texts[2]).toMatch(/navegador/);
  });
});
