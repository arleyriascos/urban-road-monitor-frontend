/**
 * Types of the map API (see docs/API-MAPA.md and the backend Swagger at /api/docs).
 * GeoJSON uses [longitude, latitude], the opposite of Leaflet's [latitude, longitude].
 */
export type Severity = 'sin baches' | 'leve' | 'moderado' | 'grave';
export type PotholeSeverity = Exclude<Severity, 'sin baches'>;
export type PotholeStatus = 'sin confirmar' | 'confirmado' | 'reparado';

export type Position = [longitude: number, latitude: number];

// Properties are type aliases (not interfaces) so they can be used as GeoJSON properties.
export type SegmentProperties = {
  roadId: number;
  name: string | null;
  roadType: string;
  lengthM: number;
  /** When true, traffic goes in the direction of the line (first to last point). */
  isOneway: boolean;
  /** Sum of severity weight x confidence. Route cost = lengthM x (1 + damageScore). */
  damageScore: number;
  severity: Severity;
  /** Color to draw the segment. */
  color: string;
  activePotholes: number;
};

export interface SegmentFeature {
  type: 'Feature';
  id: number;
  geometry: { type: 'LineString'; coordinates: Position[] };
  properties: SegmentProperties;
}

export interface SegmentCollection {
  type: 'FeatureCollection';
  features: SegmentFeature[];
}

export type PotholeProperties = {
  severity: PotholeSeverity;
  color: string;
  status: PotholeStatus;
  /** From 0 to 1. */
  confidence: number;
  detectionCount: number;
  segmentId: number | null;
  roadName: string | null;
  firstDetectedAt: string;
  lastDetectedAt: string;
};

export interface PotholeFeature {
  type: 'Feature';
  id: string;
  geometry: { type: 'Point'; coordinates: Position };
  properties: PotholeProperties;
}

export interface PotholeCollection {
  type: 'FeatureCollection';
  features: PotholeFeature[];
}

export interface NetworkStats {
  roads: number;
  segments: number;
  totalLengthKm: number;
  /** Legend: from "sin baches" to the worst severity. */
  segmentsBySeverity: { severity: Severity; color: string; count: number }[];
  potholesByStatus: { status: PotholeStatus; count: number }[];
  lastPotholeDetectedAt: string | null;
}
