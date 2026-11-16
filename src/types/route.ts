/**
 * Types of POST /api/routes (see docs/API-RUTAS.md and the backend Swagger at /api/docs).
 * GeoJSON uses [longitude, latitude], the opposite of Leaflet's [latitude, longitude].
 */
import type { Position } from './map';
import type { StretchSummary } from './roads';

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

/** One street the route follows, with the potholes along that part (POST /api/routes `streets`). */
export interface RouteStreet {
  roadId: number;
  roadName: string | null;
  /** The route steps (`properties.order`) that lie on this street. */
  fromOrder: number;
  toOrder: number;
  steps: number;
  fromSegmentIndex: number;
  toSegmentIndex: number;
  summary: StretchSummary;
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
  /**
   * The streets the route follows, in order. The backend leaves it out when it cannot work
   * it out at that moment: the route is still good, so it is always optional.
   */
  streets?: RouteStreet[];
}
