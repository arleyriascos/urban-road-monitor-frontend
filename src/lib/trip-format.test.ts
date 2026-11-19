import { describe, expect, it } from 'vitest';
import { formatMinutes, tripMinutes } from './trip-format';

describe('tripMinutes', () => {
  it('counts the minutes between the start and the end, rounded', () => {
    expect(tripMinutes('2026-11-16T13:30:00Z', '2026-11-16T14:05:00Z')).toBe(35);
    expect(tripMinutes('2026-11-16T13:30:00Z', '2026-11-16T13:30:40Z')).toBe(1);
    expect(tripMinutes('2026-11-16T13:30:00Z', '2026-11-16T13:34:29Z')).toBe(4);
  });

  it('never says 0: a trip of a few seconds is one minute', () => {
    expect(tripMinutes('2026-11-16T13:30:00Z', '2026-11-16T13:30:00Z')).toBe(1);
    expect(tripMinutes('2026-11-16T13:30:00Z', '2026-11-16T13:30:05Z')).toBe(1);
  });

  it('is null while the trip is open', () => {
    expect(tripMinutes('2026-11-16T13:30:00Z', null)).toBeNull();
  });

  it.each([
    ['not a date', '2026-11-16T13:30:00Z'],
    ['2026-11-16T13:30:00Z', 'not a date'],
    ['2026-11-16T14:00:00Z', '2026-11-16T13:00:00Z'],
  ])('is null when the dates are wrong: %s, %s', (start, end) => {
    expect(tripMinutes(start, end)).toBeNull();
  });
});

describe('formatMinutes', () => {
  it.each([
    [1, '1 min'],
    [59, '59 min'],
    [60, '1 h'],
    [65, '1 h 5 min'],
    [120, '2 h'],
    [185, '3 h 5 min'],
  ])('writes %d as %s', (minutes, text) => {
    expect(formatMinutes(minutes)).toBe(text);
  });
});
