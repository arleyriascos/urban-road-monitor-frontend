import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio, MIN_TEXT_CONTRAST } from '../lib/contrast';
import {
  boxLabel,
  drawOverlay,
  fitPlacement,
  SEVERITY_COLORS,
  type OverlayContext,
} from './overlay';
import type { Detection } from './types';

function fakeContext() {
  const calls: Array<[string, ...unknown[]]> = [];
  const context: OverlayContext = {
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    font: '',
    textBaseline: 'alphabetic',
    clearRect: (...args) => void calls.push(['clearRect', ...args]),
    strokeRect: (...args) => void calls.push(['strokeRect', ...args]),
    fillRect: (...args) => void calls.push(['fillRect', ...args]),
    fillText: (...args) => void calls.push(['fillText', ...args]),
    measureText: (text) => ({ width: text.length * 7 }),
  };
  return { context, calls };
}

const box = (x: number, y: number, width: number, height: number, score = 0.9): Detection => ({
  x,
  y,
  width,
  height,
  score,
});

describe('fitPlacement', () => {
  it('centers a wide picture in a tall view', () => {
    expect(fitPlacement({ width: 200, height: 100 }, { width: 100, height: 100 })).toEqual({
      scale: 0.5,
      offsetX: 0,
      offsetY: 25,
    });
  });

  it('centers a tall picture in a wide view', () => {
    expect(fitPlacement({ width: 100, height: 200 }, { width: 200, height: 100 })).toEqual({
      scale: 0.5,
      offsetX: 75,
      offsetY: 0,
    });
  });

  it('refuses a size of zero', () => {
    expect(() => fitPlacement({ width: 0, height: 10 }, { width: 10, height: 10 })).toThrow(
      RangeError,
    );
    expect(() => fitPlacement({ width: 10, height: 10 }, { width: 10, height: 0 })).toThrow(
      RangeError,
    );
  });
});

describe('boxLabel', () => {
  it('says the severity and the confidence in Spanish format', () => {
    expect(boxLabel('grave', 0.875)).toBe('grave · 87,5 %');
  });
});

describe('drawOverlay', () => {
  const frame = { width: 200, height: 100 };
  const view = { width: 100, height: 100 };

  it('always clears what was drawn before', () => {
    const { context, calls } = fakeContext();
    drawOverlay(context, [], frame, view);
    expect(calls).toEqual([['clearRect', 0, 0, 100, 100]]);
  });

  it('draws the frame of a box in the place it has over the shown video', () => {
    const { context, calls } = fakeContext();
    // The picture is shown at half size with 25 px of empty space above and below.
    drawOverlay(context, [box(40, 20, 100, 40)], frame, view);
    expect(calls).toContainEqual(['strokeRect', 20, 25 + 10, 50, 20]);
  });

  it('colors the box by its size: small is leve, big is grave', () => {
    const small = fakeContext();
    drawOverlay(small.context, [box(0, 0, 10, 10)], frame, view);
    expect(small.context.fillStyle).not.toBe('');
    expect(small.calls.some(([name]) => name === 'strokeRect')).toBe(true);

    const big = fakeContext();
    drawOverlay(big.context, [box(0, 0, 100, 60)], frame, view);
    expect(big.context.strokeStyle).toBe(SEVERITY_COLORS.grave);

    const little = fakeContext();
    drawOverlay(little.context, [box(0, 0, 10, 10)], frame, view);
    expect(little.context.strokeStyle).toBe(SEVERITY_COLORS.leve);
  });

  it('puts the tag above the box, or inside it when the box touches the top', () => {
    const above = fakeContext();
    drawOverlay(
      above.context,
      [box(40, 80, 20, 10)],
      { width: 100, height: 100 },
      { width: 100, height: 100 },
    );
    expect(above.calls).toContainEqual(['fillRect', 40, 60, expect.any(Number), 20]);

    const top = fakeContext();
    drawOverlay(
      top.context,
      [box(40, 5, 20, 10)],
      { width: 100, height: 100 },
      { width: 100, height: 100 },
    );
    expect(top.calls).toContainEqual(['fillRect', 40, 5, expect.any(Number), 20]);
  });

  it('writes the severity and the confidence in the tag', () => {
    const { context, calls } = fakeContext();
    drawOverlay(context, [box(0, 40, 5, 5, 0.5)], { width: 100, height: 100 }, view);
    expect(calls.find(([name]) => name === 'fillText')?.[1]).toBe('leve · 50 %');
  });

  it('draws every box', () => {
    const { context, calls } = fakeContext();
    drawOverlay(context, [box(0, 0, 10, 10), box(50, 50, 10, 10)], frame, view);
    expect(calls.filter(([name]) => name === 'strokeRect')).toHaveLength(2);
  });
});

describe('the colors of the tags', () => {
  it('keep the text readable on each severity color', () => {
    expect(contrastRatio('#1b2024', SEVERITY_COLORS.leve)).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST,
    );
    expect(contrastRatio('#1b2024', SEVERITY_COLORS.moderado)).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST,
    );
    expect(contrastRatio('#ffffff', SEVERITY_COLORS.grave)).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST,
    );
  });
});

describe('the colors of the canvas and the map', () => {
  it('are the ones of the severity tokens', () => {
    const css = readFileSync(resolve(process.cwd(), 'src', 'styles.css'), 'utf8');
    for (const [name, color] of Object.entries(SEVERITY_COLORS)) {
      expect(css).toContain(`--severity-${name}: ${color}`);
    }
  });
});
