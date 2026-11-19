import { describe, expect, it } from 'vitest';
import { englishTexts } from '../test/english';
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
    const texts = (['denied', 'unavailable', 'unsupported'] as const).map((problem) =>
      describeGpsProblem(problem),
    );
    expect(new Set(texts).size).toBe(3);
    expect(texts[0]).toMatch(/permiso/);
    expect(texts[1]).toMatch(/ubicar/);
    expect(texts[2]).toMatch(/navegador/);
  });
});

describe('describeGpsProblem in English', () => {
  it('says something different and useful for each problem, in English', () => {
    const texts = (['denied', 'unavailable', 'unsupported'] as const).map((problem) =>
      describeGpsProblem(problem, englishTexts.t),
    );
    expect(new Set(texts).size).toBe(3);
    expect(texts[0]).toMatch(/permission/);
    expect(texts[1]).toMatch(/located/);
    expect(texts[2]).toMatch(/browser/);
  });
});
