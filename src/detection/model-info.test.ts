import { describe, expect, it } from 'vitest';
import {
  MODEL_CANDIDATES,
  MODEL_INPUT_SIZE,
  MODEL_OUTPUT_ROWS,
  NMS_IOU_THRESHOLD,
  SCORE_THRESHOLD,
} from './model-info';

describe('model facts', () => {
  it('counts the candidates of the three scales of a 416 pixel picture', () => {
    expect(MODEL_CANDIDATES).toBe(52 * 52 + 26 * 26 + 13 * 13);
    expect(MODEL_CANDIDATES).toBe(3549);
  });

  it('uses a size that the network can divide by its largest stride', () => {
    expect(MODEL_INPUT_SIZE % 32).toBe(0);
  });

  it('has one row per coordinate and one for the single class', () => {
    expect(MODEL_OUTPUT_ROWS).toBe(5);
  });

  it('uses thresholds between 0 and 1', () => {
    expect(SCORE_THRESHOLD).toBeGreaterThan(0);
    expect(SCORE_THRESHOLD).toBeLessThan(1);
    expect(NMS_IOU_THRESHOLD).toBeGreaterThan(0);
    expect(NMS_IOU_THRESHOLD).toBeLessThan(1);
  });
});
