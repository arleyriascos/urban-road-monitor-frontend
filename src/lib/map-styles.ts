import type { CircleMarkerOptions, PathOptions } from 'leaflet';
import type { PotholeProperties, SegmentFeature, SegmentProperties } from '../types/map';
import { safeColor } from './html';

/** Worse streets are drawn thicker, so they stand out even when zoomed out. */
const SEGMENT_WEIGHT: Record<string, number> = {
  'sin baches': 3,
  leve: 4,
  moderado: 5,
  grave: 6,
};

const SEVERITY_RANK: Record<string, number> = {
  'sin baches': 0,
  leve: 1,
  moderado: 2,
  grave: 3,
};

const POTHOLE_RADIUS = { leve: 6, moderado: 8, grave: 10 } as const;

export function segmentStyle(segment: SegmentProperties): PathOptions {
  return {
    color: safeColor(segment.color),
    weight: SEGMENT_WEIGHT[segment.severity] ?? 3,
    opacity: segment.severity === 'sin baches' ? 0.75 : 0.95,
    lineCap: 'round',
    lineJoin: 'round',
  };
}

/**
 * Leaflet draws layers in the order they are added, so the worst segments go last:
 * a red street must never be hidden under a green one at an intersection.
 */
export function sortBySeverity(features: readonly SegmentFeature[]): SegmentFeature[] {
  return [...features].sort(
    (a, b) =>
      (SEVERITY_RANK[a.properties.severity] ?? 0) - (SEVERITY_RANK[b.properties.severity] ?? 0),
  );
}

/**
 * Size shows the severity. A dashed border means "not confirmed yet" and a faded
 * marker means "repaired".
 */
export function potholeMarkerStyle(pothole: PotholeProperties): CircleMarkerOptions {
  const repaired = pothole.status === 'reparado';
  return {
    radius: POTHOLE_RADIUS[pothole.severity] ?? 7,
    color: '#111827',
    weight: 1.5,
    opacity: repaired ? 0.5 : 1,
    fillColor: safeColor(pothole.color),
    fillOpacity: repaired ? 0.3 : 0.9,
    dashArray: pothole.status === 'sin confirmar' ? '3 3' : undefined,
  };
}
