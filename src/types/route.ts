/**
 * Types of POST /api/routes (see docs/API-RUTAS.md and the backend Swagger at /api/docs).
 * GeoJSON uses [longitude, latitude], the opposite of Leaflet's [latitude, longitude].
 */
import type { Position } from './map';

/** shortest ignores potholes, balanced weighs them and avoid_potholes avoids them hard. */
export type RouteCriterion = 'shortest' | 'balanced' | 'avoid_potholes';
export type RouteAlgorithm = 'astar' | 'dijkstra';

/** A point on the map, as the backend expects it. */
export interface LatLng {
  latitude: number;
  longitude: number;
}

/** The intersection a click was moved to, and how far it was. */
export interface RoutePoint extends LatLng {
  nodeId: number;
  distanceM: number;
}

export type RouteStepProperties = {
  order: number;
  segmentId: number;
  roadName: string | null;
  /** True if the segment is crossed against its stored drawing (already drawn in travel order). */
  reversed: boolean;
  lengthM: number;
  damageScore: number;
  cost: number;
};

export interface RouteStepFeature {
  type: 'Feature';
  id: number;
  geometry: { type: 'LineString'; coordinates: Position[] };
  properties: RouteStepProperties;
}

export interface RouteAnswer {
  criterion: RouteCriterion;
  algorithm: RouteAlgorithm;
  fromCache: boolean;
  origin: RoutePoint;
  destination: RoutePoint;
  summary: {
    lengthM: number;
    cost: number;
    steps: number;
    exploredNodes: number;
    computationMs: number;
  };
  route: { type: 'FeatureCollection'; features: RouteStepFeature[] };
}
