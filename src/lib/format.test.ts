import { describe, expect, it } from 'vitest';
import {
  capitalize,
  formatCostMultiplier,
  formatDecimal,
  formatLength,
  formatNumber,
  formatPercent,
  pluralize,
} from './format';

describe('formatNumber', () => {
  it('uses dots as thousands separators', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(1000)).toBe('1.000');
    expect(formatNumber(18_432)).toBe('18.432');
    expect(formatNumber(1_234_567)).toBe('1.234.567');
  });

  it('rounds to a whole number', () => {
    expect(formatNumber(10_084.6)).toBe('10.085');
  });
});

describe('formatDecimal', () => {
  it('uses a comma as decimal separator', () => {
    expect(formatDecimal(612.4)).toBe('612,4');
    expect(formatDecimal(774.06)).toBe('774,1');
    expect(formatDecimal(3, 2)).toBe('3,00');
  });
});

describe('formatLength', () => {
  it('shows meters below a kilometer', () => {
    expect(formatLength(0)).toBe('0 m');
    expect(formatLength(111.17)).toBe('111 m');
    expect(formatLength(999.4)).toBe('999 m');
  });

  it('shows kilometers from 1000 meters', () => {
    expect(formatLength(1000)).toBe('1,0 km');
    expect(formatLength(1234)).toBe('1,2 km');
  });
});

describe('formatPercent', () => {
  it('drops the decimal when it is zero', () => {
    expect(formatPercent(0.5)).toBe('50 %');
    expect(formatPercent(1)).toBe('100 %');
    expect(formatPercent(0.2)).toBe('20 %');
  });

  it('keeps one decimal otherwise', () => {
    expect(formatPercent(0.875)).toBe('87,5 %');
    expect(formatPercent(0.9375)).toBe('93,7 %');
  });

  it('never rounds up to 100 % unless the value is exactly 1', () => {
    expect(formatPercent(0.9995)).toBe('99,9 %');
    expect(formatPercent(0.9998)).toBe('99,9 %');
    expect(formatPercent(1)).toBe('100 %');
  });
});

describe('formatCostMultiplier', () => {
  it('is x1 for a street without damage', () => {
    expect(formatCostMultiplier(0)).toBe('×1');
  });

  it('is x7 for one sure severe pothole (damage 6)', () => {
    expect(formatCostMultiplier(6)).toBe('×7');
  });

  it('shows one decimal when needed', () => {
    expect(formatCostMultiplier(4.5)).toBe('×5,5');
    expect(formatCostMultiplier(5.9)).toBe('×6,9');
  });
});

describe('capitalize', () => {
  it('upper-cases the first letter only', () => {
    expect(capitalize('leve')).toBe('Leve');
    expect(capitalize('sin baches')).toBe('Sin baches');
    expect(capitalize('')).toBe('');
  });
});

describe('pluralize', () => {
  it('uses the singular only for exactly one', () => {
    expect(pluralize(1, 'bache', 'baches')).toBe('1 bache');
    expect(pluralize(0, 'bache', 'baches')).toBe('0 baches');
    expect(pluralize(54, 'bache', 'baches')).toBe('54 baches');
  });

  it('formats the number too', () => {
    expect(pluralize(1200, 'vía', 'vías')).toBe('1.200 vías');
  });
});
