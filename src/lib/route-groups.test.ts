import { describe, expect, it } from 'vitest';
import { routeFixture } from '../test/route-fixtures';
import type { RouteAnswer, RouteStepFeature } from '../types/route';
import { UNNAMED_STREET, countDamagedSteps, groupRouteSteps } from './route-groups';

function step(
  order: number,
  roadName: string | null,
  lengthM = 100,
  damageScore = 0,
): RouteStepFeature {
  return {
    type: 'Feature',
    id: order,
    geometry: {
      type: 'LineString',
      coordinates: [
        [-77.28 + order / 1000, 1.21],
        [-77.28 + (order + 1) / 1000, 1.21],
      ],
    },
    properties: {
      order,
      segmentId: order,
      roadName,
      reversed: false,
      lengthM,
      damageScore,
      cost: lengthM,
    },
  };
}

function routeOf(...steps: RouteStepFeature[]): RouteAnswer {
  return { ...routeFixture, route: { type: 'FeatureCollection', features: steps } };
}

describe('groupRouteSteps', () => {
  it('joins the segments that follow each other on the same street', () => {
    const groups = groupRouteSteps(routeFixture);

    expect(groups.map((group) => [group.name, group.steps.length])).toEqual([
      ['Calle 18', 2],
      [UNNAMED_STREET, 1],
    ]);
  });

  it('adds up the length and counts the damaged segments of each street', () => {
    const [calle18, unnamed] = groupRouteSteps(routeFixture);

    expect(calle18.lengthM).toBeCloseTo(223.5, 6);
    expect(calle18.damagedSteps).toBe(1);
    expect(unnamed.lengthM).toBeCloseTo(112.9, 6);
    expect(unnamed.damagedSteps).toBe(0);
  });

  it('numbers the groups from 0 in travel order', () => {
    const groups = groupRouteSteps(routeOf(step(1, 'A'), step(2, 'B'), step(3, 'B'), step(4, 'C')));
    expect(groups.map((group) => group.index)).toEqual([0, 1, 2]);
    expect(groups.map((group) => group.name)).toEqual(['A', 'B', 'C']);
  });

  it('makes a new group when a street comes back later in the route', () => {
    const groups = groupRouteSteps(routeOf(step(1, 'A'), step(2, 'B'), step(3, 'A')));
    expect(groups.map((group) => group.name)).toEqual(['A', 'B', 'A']);
  });

  it('groups consecutive segments without a name, and treats blank names as no name', () => {
    const groups = groupRouteSteps(
      routeOf(step(1, null), step(2, '  '), step(3, ''), step(4, 'A')),
    );
    expect(groups.map((group) => [group.name, group.steps.length])).toEqual([
      [UNNAMED_STREET, 3],
      ['A', 1],
    ]);
  });

  it('keeps every segment exactly once', () => {
    const groups = groupRouteSteps(
      routeOf(step(1, 'A'), step(2, 'A'), step(3, null), step(4, 'B')),
    );
    expect(groups.flatMap((group) => group.steps.map((s) => s.properties.order))).toEqual([
      1, 2, 3, 4,
    ]);
  });

  it('has no groups for a route without segments', () => {
    expect(groupRouteSteps(routeOf())).toEqual([]);
  });
});

describe('countDamagedSteps', () => {
  it('counts the damaged segments of the whole route', () => {
    const groups = groupRouteSteps(
      routeOf(step(1, 'A', 100, 2), step(2, 'A', 100, 0), step(3, 'B', 100, 0.5)),
    );
    expect(countDamagedSteps(groups)).toBe(2);
  });
});
