import { describe, expect, it } from 'vitest';
import { MIN_TEXT_CONTRAST, contrastRatio, relativeLuminance } from './contrast';

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 10);
  });

  it('accepts the short form and any case', () => {
    expect(relativeLuminance('#FFF')).toBeCloseTo(relativeLuminance('#ffffff'), 10);
    expect(relativeLuminance('#2B2F33')).toBeCloseTo(relativeLuminance('#2b2f33'), 10);
  });

  it('rejects what is not a hex color', () => {
    expect(() => relativeLuminance('white')).toThrow('Not a hex color: white');
    expect(() => relativeLuminance('#12')).toThrow();
    expect(() => relativeLuminance('var(--surface)')).toThrow();
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for a color against itself', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#2563eb', '#2563eb')).toBe(1);
  });

  it('is the same whichever color is the text', () => {
    expect(contrastRatio('#2563eb', '#ffffff')).toBe(contrastRatio('#ffffff', '#2563eb'));
  });

  it('matches the published threshold values', () => {
    // #767676 is the lightest gray that passes on white; #777777 just fails.
    expect(contrastRatio('#767676', '#ffffff')).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    expect(contrastRatio('#777777', '#ffffff')).toBeLessThan(MIN_TEXT_CONTRAST);
  });

  it('measures the defects found in production', () => {
    // The route link blue on the dark panel, and the street name on the light violet pick.
    expect(contrastRatio('#2563eb', '#25292d')).toBeCloseTo(2.83, 1);
    expect(contrastRatio('#e9ebec', '#ede9fe')).toBeLessThan(1.2);
  });
});
