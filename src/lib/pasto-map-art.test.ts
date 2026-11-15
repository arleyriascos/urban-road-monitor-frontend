import { describe, expect, it } from 'vitest';
import {
  PASTO_MAIN_ROADS,
  PASTO_MAP_HEIGHT,
  PASTO_MAP_WIDTH,
  PASTO_NETWORK,
  PASTO_SIDE_STREETS,
} from './pasto-map-art';

/** Reads a path made only of "M x y" and "l dx dy" and returns every point it visits. */
function points(path: string): Array<[number, number]> {
  const found: Array<[number, number]> = [];
  let x = 0;
  let y = 0;
  const commands = path.match(/[Ml]-?\d+ -?\d+/g) ?? [];
  expect(commands.join('')).toBe(path);
  for (const command of commands) {
    const [a, b] = command.slice(1).split(' ').map(Number) as [number, number];
    if (command.startsWith('M')) {
      x = a;
      y = b;
    } else {
      x += a;
      y += b;
    }
    found.push([x, y]);
  }
  return found;
}

describe('the drawing of the streets of Pasto', () => {
  it('is made only of absolute starts and relative steps, so it is a valid SVG path', () => {
    expect(PASTO_MAIN_ROADS.startsWith('M')).toBe(true);
    expect(PASTO_SIDE_STREETS.startsWith('M')).toBe(true);
    expect(points(PASTO_MAIN_ROADS).length).toBeGreaterThan(500);
    expect(points(PASTO_SIDE_STREETS).length).toBeGreaterThan(300);
  });

  it('keeps most of the streets inside the picture', () => {
    for (const path of [PASTO_MAIN_ROADS, PASTO_SIDE_STREETS]) {
      const all = points(path);
      const inside = all.filter(
        ([x, y]) => x >= -10 && x <= PASTO_MAP_WIDTH + 10 && y >= -10 && y <= PASTO_MAP_HEIGHT + 10,
      );
      expect(inside.length / all.length).toBeGreaterThan(0.97);
    }
  });

  it('spreads over the whole picture, not over one corner', () => {
    const all = [...points(PASTO_MAIN_ROADS), ...points(PASTO_SIDE_STREETS)];
    const quadrants = new Set(
      all.map(
        ([x, y]) => `${x < PASTO_MAP_WIDTH / 2 ? 'w' : 'e'}${y < PASTO_MAP_HEIGHT / 2 ? 'n' : 's'}`,
      ),
    );
    expect(quadrants.size).toBe(4);
  });

  it('states the size of the imported network', () => {
    expect(PASTO_NETWORK).toEqual({ roads: 4610, segments: 10134, kilometers: 774 });
  });
});
