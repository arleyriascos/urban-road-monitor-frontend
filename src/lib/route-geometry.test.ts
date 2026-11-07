import { describe, expect, it } from 'vitest';
import { routeFixture } from '../test/route-fixtures';
import type { Position } from '../types/map';
import type { RouteAnswer } from '../types/route';
import { arrowSpots, bearingDegrees, distanceM, midpointOf } from './route-geometry';

const origin: Position = [-77.28, 1.21];

describe('distanceM', () => {
  it('is about 111 m for 0.001 degrees of latitude', () => {
    expect(distanceM(origin, [-77.28, 1.211])).toBeCloseTo(111.2, 0);
  });

  it('is 0 for the same point', () => {
    expect(distanceM(origin, origin)).toBe(0);
  });
});

describe('bearingDegrees', () => {
  it.each([
    ['north', [-77.28, 1.22], 0],
    ['east', [-77.27, 1.21], 90],
    ['south', [-77.28, 1.2], 180],
    ['west', [-77.29, 1.21], 270],
  ] as const)('points %s', (_name, to, expected) => {
    expect(bearingDegrees(origin, to as Position)).toBeCloseTo(expected, 0);
  });

  it('is always between 0 and 360', () => {
    for (const to of [
      [-77.3, 1.3],
      [-77.2, 1.1],
      [-77.4, 1.05],
      [-77.1, 1.4],
    ] as Position[]) {
      const bearing = bearingDegrees(origin, to);
      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
    }
  });
});

describe('midpointOf', () => {
  it('finds the middle of a straight line and its direction', () => {
    const middle = midpointOf([origin, [-77.28, 1.212]]);
    expect(middle?.point[1]).toBeCloseTo(1.211, 6);
    expect(middle?.bearing).toBeCloseTo(0, 0);
  });

  it('finds the middle by length, not by the number of points', () => {
    // 3 points, but the first leg is 3 times longer: the middle falls inside it.
    const middle = midpointOf([origin, [-77.28, 1.213], [-77.28, 1.214]]);
    expect(middle?.point[1]).toBeCloseTo(1.212, 6);
  });

  it('points the way of the segment where the middle falls', () => {
    // An L: north for 111 m, then east for 111 m. The middle is at the corner or just after it.
    const middle = midpointOf([origin, [-77.28, 1.211], [-77.279, 1.211]]);
    expect(middle).not.toBeNull();
    expect([0, 90].some((expected) => Math.abs((middle?.bearing ?? 999) - expected) < 1)).toBe(
      true,
    );
  });

  it('has no middle for a point or a line of zero length', () => {
    expect(midpointOf([origin])).toBeNull();
    expect(midpointOf([origin, origin])).toBeNull();
    expect(midpointOf([])).toBeNull();
  });
});

describe('arrowSpots', () => {
  it('puts one arrow on each segment of 40 m or more', () => {
    expect(arrowSpots(routeFixture).map((spot) => spot.order)).toEqual([1, 2, 3]);
  });

  it('skips the short segments', () => {
    const route: RouteAnswer = {
      ...routeFixture,
      route: {
        ...routeFixture.route,
        features: routeFixture.route.features.map((feature, index) =>
          index === 1
            ? { ...feature, properties: { ...feature.properties, lengthM: 25 } }
            : feature,
        ),
      },
    };
    expect(arrowSpots(route).map((spot) => spot.order)).toEqual([1, 3]);
  });

  it('points the way of the trip, east for the first segment of the fixture', () => {
    const [first] = arrowSpots(routeFixture);
    expect(first.bearing).toBeGreaterThan(80);
    expect(first.bearing).toBeLessThan(100);
    expect(first.longitude).toBeCloseTo(-77.2806, 4);
  });

  it('follows the travel order of a segment crossed against its drawing', () => {
    // The fixture's second segment is "reversed": its points already go the way of the trip.
    const second = arrowSpots(routeFixture)[1];
    expect(second.bearing).toBeGreaterThan(0);
    expect(second.bearing).toBeLessThan(90);
  });
});
