import { describe, expect, it } from 'vitest';
import {
  MIN_ARROW_ZOOM,
  arrowsVisibleAt,
  coveredInsets,
  fitsInFreeArea,
  type Insets,
  type Rect,
} from './view';

const map: Rect = { left: 0, top: 60, right: 1200, bottom: 760 };

describe('coveredInsets on a wide screen', () => {
  it('leaves room for the route panel on the left and the legend on the right', () => {
    const insets = coveredInsets({
      map,
      panel: { left: 12, top: 72, right: 372, bottom: 700 },
      legend: { left: 940, top: 72, right: 1188, bottom: 400 },
      phone: false,
    });

    expect(insets.paddingTopLeft).toEqual([392, 30]);
    expect(insets.paddingBottomRight).toEqual([280, 24]);
  });

  it('only keeps a small margin where nothing covers the map', () => {
    const insets = coveredInsets({ map, panel: null, legend: null, phone: false });
    expect(insets).toEqual({ paddingTopLeft: [24, 30], paddingBottomRight: [24, 24] });
  });

  it('measures from the map, not from the window', () => {
    const offset: Rect = { left: 100, top: 0, right: 1300, bottom: 700 };
    const insets = coveredInsets({
      map: offset,
      panel: { left: 112, top: 12, right: 472, bottom: 600 },
      legend: null,
      phone: false,
    });
    expect(insets.paddingTopLeft[0]).toBe(392);
  });
});

describe('coveredInsets on a phone', () => {
  const sheet: Rect = { left: 8, top: 430, right: 392, bottom: 740 };
  const phoneMap: Rect = { left: 0, top: 160, right: 400, bottom: 780 };

  it('leaves room for the panel at the bottom, as tall as it really is', () => {
    const insets = coveredInsets({ map: phoneMap, panel: sheet, legend: null, phone: true });
    expect(insets.paddingBottomRight).toEqual([24, 366]);
    expect(insets.paddingTopLeft).toEqual([24, 70]);
  });

  it('follows the height of the panel', () => {
    const tall = coveredInsets({
      map: phoneMap,
      panel: { ...sheet, top: 300 },
      legend: null,
      phone: true,
    });
    expect(tall.paddingBottomRight[1]).toBeGreaterThan(366);
  });

  it('ignores the legend, which is hidden while the panel is open', () => {
    const insets = coveredInsets({
      map: phoneMap,
      panel: sheet,
      legend: { left: 8, top: 700, right: 392, bottom: 760 },
      phone: true,
    });
    expect(insets.paddingBottomRight[0]).toBe(24);
  });
});

describe('fitsInFreeArea', () => {
  const size = { width: 1200, height: 700 };
  const insets: Insets = { paddingTopLeft: [392, 30], paddingBottomRight: [280, 24] };

  it('is true for an area inside the part that stays visible', () => {
    expect(fitsInFreeArea({ x: 500, y: 100 }, { x: 900, y: 600 }, size, insets)).toBe(true);
  });

  it('is false for an area that goes under the panel', () => {
    expect(fitsInFreeArea({ x: 200, y: 100 }, { x: 900, y: 600 }, size, insets)).toBe(false);
  });

  it('is false for an area under the legend, or below the bottom margin', () => {
    expect(fitsInFreeArea({ x: 500, y: 100 }, { x: 1000, y: 600 }, size, insets)).toBe(false);
    expect(fitsInFreeArea({ x: 500, y: 100 }, { x: 900, y: 690 }, size, insets)).toBe(false);
  });

  it('is true right on the limits', () => {
    expect(fitsInFreeArea({ x: 392, y: 30 }, { x: 920, y: 676 }, size, insets)).toBe(true);
  });

  it('is false one pixel past a limit', () => {
    expect(fitsInFreeArea({ x: 391, y: 30 }, { x: 920, y: 676 }, size, insets)).toBe(false);
    expect(fitsInFreeArea({ x: 392, y: 29 }, { x: 920, y: 676 }, size, insets)).toBe(false);
    expect(fitsInFreeArea({ x: 392, y: 30 }, { x: 921, y: 676 }, size, insets)).toBe(false);
    expect(fitsInFreeArea({ x: 392, y: 30 }, { x: 920, y: 677 }, size, insets)).toBe(false);
  });
});

describe('arrowsVisibleAt', () => {
  it('shows the arrows from zoom 15 on', () => {
    expect(MIN_ARROW_ZOOM).toBe(15);
    expect(arrowsVisibleAt(14.9)).toBe(false);
    expect(arrowsVisibleAt(15)).toBe(true);
    expect(arrowsVisibleAt(18)).toBe(true);
  });

  it('hides them when the whole city is in view', () => {
    expect(arrowsVisibleAt(12)).toBe(false);
  });
});
