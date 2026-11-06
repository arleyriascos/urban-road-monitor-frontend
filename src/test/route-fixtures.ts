import type { RouteAnswer } from '../types/route';

/**
 * A small route with the same shape as a real POST /api/routes answer: three segments,
 * two on Calle 18 (the second one crossed against its drawing) and one without a name.
 */
export const routeFixture: RouteAnswer = {
  criterion: 'balanced',
  algorithm: 'astar',
  fromCache: false,
  origin: { nodeId: 1042, latitude: 1.2136, longitude: -77.2811, distanceM: 3.2 },
  destination: { nodeId: 2210, latitude: 1.215, longitude: -77.279, distanceM: 1.1 },
  summary: { lengthM: 336.4, cost: 448.7, steps: 3, exploredNodes: 17, computationMs: 0 },
  route: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 1,
        geometry: {
          type: 'LineString',
          coordinates: [
            [-77.2811, 1.2136],
            [-77.2801, 1.2137],
          ],
        },
        properties: {
          order: 1,
          segmentId: 11,
          roadName: 'Calle 18',
          reversed: false,
          lengthM: 111.2,
          damageScore: 0,
          cost: 111.2,
        },
      },
      {
        type: 'Feature',
        id: 2,
        geometry: {
          type: 'LineString',
          coordinates: [
            [-77.2801, 1.2137],
            [-77.2796, 1.2142],
            [-77.2791, 1.2144],
          ],
        },
        properties: {
          order: 2,
          segmentId: 12,
          roadName: 'Calle 18',
          reversed: true,
          lengthM: 112.3,
          damageScore: 2,
          cost: 224.6,
        },
      },
      {
        type: 'Feature',
        id: 3,
        geometry: {
          type: 'LineString',
          coordinates: [
            [-77.2791, 1.2144],
            [-77.279, 1.215],
          ],
        },
        properties: {
          order: 3,
          segmentId: 13,
          roadName: null,
          reversed: false,
          lengthM: 112.9,
          damageScore: 0,
          cost: 112.9,
        },
      },
    ],
  },
};
