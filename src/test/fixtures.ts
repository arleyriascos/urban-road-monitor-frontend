import type { NetworkStats, PotholeCollection, SegmentCollection } from '../types/map';

/** Small samples with the same shape as the real API responses. */
export const segmentsFixture: SegmentCollection = {
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
        roadId: 10,
        name: 'Calle 16',
        roadType: 'Calle residencial',
        lengthM: 111.17,
        isOneway: false,
        damageScore: 0,
        severity: 'sin baches',
        color: '#22C55E',
        activePotholes: 0,
      },
    },
    {
      type: 'Feature',
      id: 2,
      geometry: {
        type: 'LineString',
        coordinates: [
          [-77.2801, 1.2137],
          [-77.2791, 1.2138],
        ],
      },
      properties: {
        roadId: 11,
        name: null,
        roadType: 'Vía terciaria',
        lengthM: 98.4,
        isOneway: true,
        damageScore: 5.9,
        severity: 'grave',
        color: '#DC2626',
        activePotholes: 2,
      },
    },
    {
      type: 'Feature',
      id: 3,
      geometry: {
        type: 'LineString',
        coordinates: [
          [-77.2791, 1.2138],
          [-77.2781, 1.2139],
        ],
      },
      properties: {
        roadId: 12,
        name: 'Carrera 24',
        roadType: 'Vía secundaria',
        lengthM: 1250,
        isOneway: false,
        damageScore: 0.75,
        severity: 'leve',
        color: '#FACC15',
        activePotholes: 1,
      },
    },
  ],
};

export const potholesFixture: PotholeCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'a1',
      geometry: { type: 'Point', coordinates: [-77.2795, 1.2137] },
      properties: {
        severity: 'grave',
        color: '#DC2626',
        status: 'confirmado',
        confidence: 0.875,
        detectionCount: 3,
        segmentId: 2,
        roadName: null,
        firstDetectedAt: '2026-09-26T08:55:44.282Z',
        lastDetectedAt: '2026-10-25T05:21:44.282Z',
      },
    },
    {
      type: 'Feature',
      id: 'a2',
      geometry: { type: 'Point', coordinates: [-77.2785, 1.2139] },
      properties: {
        severity: 'moderado',
        color: '#F97316',
        status: 'sin confirmar',
        confidence: 0.5,
        detectionCount: 1,
        segmentId: 3,
        roadName: 'Carrera 24',
        firstDetectedAt: '2026-10-02T08:41:44.282Z',
        lastDetectedAt: '2026-10-23T11:41:44.282Z',
      },
    },
    {
      type: 'Feature',
      id: 'a3',
      geometry: { type: 'Point', coordinates: [-77.2808, 1.2136] },
      properties: {
        severity: 'leve',
        color: '#FACC15',
        status: 'reparado',
        confidence: 0.2,
        detectionCount: 8,
        segmentId: 1,
        roadName: 'Calle 16',
        firstDetectedAt: '2026-09-19T12:39:44.282Z',
        lastDetectedAt: '2026-09-24T03:46:44.282Z',
      },
    },
  ],
};

export const statsFixture: NetworkStats = {
  roads: 4610,
  segments: 10134,
  totalLengthKm: 774.06,
  segmentsBySeverity: [
    { severity: 'sin baches', color: '#22C55E', count: 10085 },
    { severity: 'leve', color: '#FACC15', count: 15 },
    { severity: 'moderado', color: '#F97316', count: 19 },
    { severity: 'grave', color: '#DC2626', count: 15 },
  ],
  potholesByStatus: [
    { status: 'sin confirmar', count: 9 },
    { status: 'confirmado', count: 45 },
    { status: 'reparado', count: 6 },
  ],
  lastPotholeDetectedAt: '2026-10-25T05:21:44.282Z',
};
