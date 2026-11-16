import { describe, expect, it } from 'vitest';
import { createMeters } from './meters';
import type { DetectionResult } from './detector';

const FRAME = { width: 1000, height: 1000 };

function result(
  boxes: Array<[number, number]> = [],
  inferenceMs = 100,
  totalMs = 120,
): DetectionResult {
  return {
    frame: FRAME,
    detections: boxes.map(([width, height], index) => ({
      x: index * 10,
      y: 0,
      width,
      height,
      score: 0.8,
    })),
    timings: { captureMs: 5, inferenceMs, totalMs },
  };
}

describe('createMeters: performance', () => {
  it('has no rate with a single measurement, but has the times', () => {
    const meters = createMeters();
    const { performance } = meters.record(result(), 0);
    expect(performance).toEqual({ fps: null, inferenceMs: 100, totalMs: 120 });
  });

  it('gives the detections per second over the moments', () => {
    const meters = createMeters();
    meters.record(result(), 0);
    meters.record(result(), 500);
    const { performance } = meters.record(result(), 1000);
    expect(performance.fps).toBeCloseTo(2);
  });

  it('gives the median of the times, so one slow detection does not shake the number', () => {
    const meters = createMeters();
    meters.record(result([], 100, 120), 0);
    meters.record(result([], 110, 130), 300);
    const { performance } = meters.record(result([], 900, 920), 600);
    expect(performance.inferenceMs).toBe(110);
    expect(performance.totalMs).toBe(130);
  });

  it('only looks at the last measurements', () => {
    const meters = createMeters(3);
    meters.record(result([], 1000, 1000), 0);
    meters.record(result([], 10, 10), 100);
    meters.record(result([], 10, 10), 200);
    const { performance } = meters.record(result([], 10, 10), 300);
    expect(performance.inferenceMs).toBe(10);
  });

  it('starts again after a reset', () => {
    const meters = createMeters();
    meters.record(result(), 0);
    meters.record(result(), 500);
    meters.reset();
    expect(meters.record(result(), 9000).performance.fps).toBeNull();
  });
});

describe('createMeters: size', () => {
  it('has no boxes and no average when nothing was found', () => {
    const { size } = createMeters().record(result(), 0);
    expect(size).toEqual({
      boxes: [],
      counts: { leve: 0, moderado: 0, grave: 0 },
      averageRatio: null,
    });
  });

  it('gives each box its share of the picture and its severity, biggest first', () => {
    // 50x100 = 0.5 % (leve), 300x100 = 3 % (moderado), 500x200 = 10 % (grave)
    const { size } = createMeters().record(
      result([
        [50, 100],
        [500, 200],
        [300, 100],
      ]),
      0,
    );
    expect(size.boxes.map((box) => [box.ratio, box.severity])).toEqual([
      [0.1, 'grave'],
      [0.03, 'moderado'],
      [0.005, 'leve'],
    ]);
    expect(size.counts).toEqual({ leve: 1, moderado: 1, grave: 1 });
    expect(size.averageRatio).toBeCloseTo(0.045);
  });

  it('keeps the score of each box', () => {
    const { size } = createMeters().record(result([[100, 100]]), 0);
    expect(size.boxes[0].score).toBe(0.8);
  });
});
