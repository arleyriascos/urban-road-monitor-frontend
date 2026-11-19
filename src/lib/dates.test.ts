import { describe, expect, it } from 'vitest';
import { formatDateTime } from './dates';

describe('formatDateTime', () => {
  it('shows a dash when there is no date', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime('')).toBe('—');
  });

  it('shows a dash when the date is invalid', () => {
    expect(formatDateTime('esto no es una fecha')).toBe('—');
  });

  it('formats a valid date with its year', () => {
    const text = formatDateTime('2026-10-25T17:21:44.282Z');
    expect(text).toContain('2026');
    expect(text).toContain('25');
  });

  it('uses the time of Colombia (UTC-5), which can change the day', () => {
    // 03:00 UTC is 22:00 of the previous day in Bogotá.
    const text = formatDateTime('2026-10-25T03:00:00.000Z');
    expect(text).toContain('24');
    expect(text).not.toContain('25');
  });

  it('writes the month in the language of the app, with the same hour', () => {
    expect(formatDateTime('2026-10-25T17:21:00.000Z', 'es')).toContain('25/10/2026');
    expect(formatDateTime('2026-10-25T17:21:00.000Z', 'en')).toContain('Oct');
    expect(formatDateTime('2026-10-25T17:21:00.000Z', 'en')).toMatch(/12:21/);
  });
});
