import { describe, expect, it } from 'vitest';
import {
  createDistanceTracker,
  distanceBetween,
  MAX_TRACK_ACCURACY_M,
  MIN_STEP_M,
  type GpsFix,
} from './geo';

const fix = (latitude: number, longitude: number, accuracyM = 5): GpsFix => ({
  latitude,
  longitude,
  accuracyM,
  timestamp: 0,
});

describe('distanceBetween', () => {
  it('is zero for the same point', () => {
    expect(distanceBetween(fix(1.2, -77.3), fix(1.2, -77.3))).toBe(0);
  });

  it('measures about 111 m for 0.001 degrees of latitude', () => {
    expect(distanceBetween(fix(1.2, -77.3), fix(1.201, -77.3))).toBeCloseTo(111.19, 0);
  });

  it('measures the same in both directions', () => {
    const a = fix(1.2136, -77.2811);
    const b = fix(1.2201, -77.2749);
    expect(distanceBetween(a, b)).toBeCloseTo(distanceBetween(b, a), 6);
  });
});

describe('the distance tracker', () => {
  it('adds up the steps of the trip', () => {
    const tracker = createDistanceTracker();
    tracker.add(fix(1.2, -77.3));
    tracker.add(fix(1.201, -77.3));
    tracker.add(fix(1.202, -77.3));
    expect(tracker.total()).toBeCloseTo(222.4, 0);
  });

  it('starts at zero and counts nothing with one fix', () => {
    const tracker = createDistanceTracker();
    expect(tracker.total()).toBe(0);
    tracker.add(fix(1.2, -77.3));
    expect(tracker.total()).toBe(0);
  });

  it('ignores the small jumps of a still phone', () => {
    const tracker = createDistanceTracker();
    tracker.add(fix(1.2, -77.3));
    // About 1 m: below the minimum step.
    tracker.add(fix(1.200009, -77.3));
    expect(tracker.total()).toBe(0);
    expect(MIN_STEP_M).toBeGreaterThan(1);
  });

  it('keeps the last good point, so slow movement still adds up', () => {
    const tracker = createDistanceTracker();
    tracker.add(fix(1.2, -77.3));
    tracker.add(fix(1.200018, -77.3)); // about 2 m: ignored, the point stays
    tracker.add(fix(1.200036, -77.3)); // about 4 m from the kept point
    expect(tracker.total()).toBeCloseTo(4, 0);
  });

  it('ignores fixes that are not accurate enough', () => {
    const tracker = createDistanceTracker();
    tracker.add(fix(1.2, -77.3));
    tracker.add(fix(1.21, -77.3, MAX_TRACK_ACCURACY_M + 1));
    expect(tracker.total()).toBe(0);
  });
});
