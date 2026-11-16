import { describe, expect, it } from 'vitest';
import type { Detection, FrameSize } from '../detection/types';
import type { GpsFix } from './geo';
import {
  areaRatio,
  createRepeatFilter,
  DEFAULT_RULES,
  REPEAT_RADIUS_M,
  REPEAT_WINDOW_MS,
  toPayload,
} from './candidate';

const FRAME: FrameSize = { width: 1000, height: 500 };
const BOX: Detection = { x: 100, y: 100, width: 200, height: 100, score: 0.82 };
const FIX: GpsFix = { latitude: 1.2136, longitude: -77.2811, accuracyM: 6.5, timestamp: 0 };
const WHEN = new Date('2026-11-16T13:41:12.000Z');

describe('areaRatio', () => {
  it('is the share of the picture the box covers', () => {
    expect(areaRatio(BOX, FRAME)).toBeCloseTo(0.04, 10);
  });

  it('is 0 for an empty picture and never more than 1', () => {
    expect(areaRatio(BOX, { width: 0, height: 0 })).toBe(0);
    expect(areaRatio({ ...BOX, width: 5000, height: 5000 }, FRAME)).toBe(1);
  });
});

describe('toPayload', () => {
  it('builds what the server expects, without the severity', () => {
    expect(toPayload(BOX, FRAME, FIX, DEFAULT_RULES, 'id-1', WHEN)).toEqual({
      id: 'id-1',
      latitude: 1.2136,
      longitude: -77.2811,
      gpsAccuracyM: 6.5,
      confidence: 0.82,
      bboxAreaRatio: 0.04,
      detectedAt: '2026-11-16T13:41:12.000Z',
    });
  });

  it('keeps nothing the model is not sure enough about', () => {
    expect(toPayload({ ...BOX, score: 0.39 }, FRAME, FIX, DEFAULT_RULES, 'id', WHEN)).toBeNull();
    expect(toPayload({ ...BOX, score: 0.4 }, FRAME, FIX, DEFAULT_RULES, 'id', WHEN)).not.toBeNull();
  });

  it('uses the minimum confidence the server announced', () => {
    const rules = { ...DEFAULT_RULES, minConfidence: 0.6 };
    expect(toPayload({ ...BOX, score: 0.5 }, FRAME, FIX, rules, 'id', WHEN)).toBeNull();
  });

  it('keeps nothing when the GPS is not accurate enough', () => {
    expect(
      toPayload(BOX, FRAME, { ...FIX, accuracyM: 20.5 }, DEFAULT_RULES, 'id', WHEN),
    ).toBeNull();
    expect(
      toPayload(BOX, FRAME, { ...FIX, accuracyM: 20 }, DEFAULT_RULES, 'id', WHEN),
    ).not.toBeNull();
  });

  it('keeps nothing for a box with no area', () => {
    expect(toPayload({ ...BOX, width: 0 }, FRAME, FIX, DEFAULT_RULES, 'id', WHEN)).toBeNull();
  });

  it('never sends a confidence above 1', () => {
    expect(
      toPayload({ ...BOX, score: 1.2 }, FRAME, FIX, DEFAULT_RULES, 'id', WHEN)?.confidence,
    ).toBe(1);
  });
});

describe('the repeat filter', () => {
  const here = { latitude: 1.2, longitude: -77.3 };
  // About 11 m north of `here`.
  const farther = { latitude: 1.2001, longitude: -77.3 };

  it('accepts the first detection and refuses the same place right after', () => {
    const filter = createRepeatFilter();
    expect(filter.accept(here, 0)).toBe(true);
    expect(filter.accept(here, 300)).toBe(false);
  });

  it('accepts another place', () => {
    const filter = createRepeatFilter();
    filter.accept(here, 0);
    expect(filter.accept(farther, 300)).toBe(true);
  });

  it('accepts the same place again after the window', () => {
    const filter = createRepeatFilter();
    filter.accept(here, 0);
    expect(filter.accept(here, REPEAT_WINDOW_MS - 1)).toBe(false);
    expect(filter.accept(here, REPEAT_WINDOW_MS)).toBe(true);
  });

  it('has a radius of a few meters', () => {
    expect(REPEAT_RADIUS_M).toBeGreaterThan(2);
    expect(REPEAT_RADIUS_M).toBeLessThan(15);
  });
});
