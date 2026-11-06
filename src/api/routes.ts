import type { LatLng, RouteAlgorithm, RouteAnswer, RouteCriterion } from '../types/route';
import { postJson } from './http';

export interface RouteQuery {
  origin: LatLng;
  destination: LatLng;
  criterion: RouteCriterion;
  /** Optional: the backend uses A* when it is not sent. */
  algorithm?: RouteAlgorithm;
}

/** Route between two points, ready to draw. The backend rounds the clicks and caches routes. */
export function getRoute(query: RouteQuery, signal?: AbortSignal): Promise<RouteAnswer> {
  return postJson<RouteAnswer>('/api/routes', query, { signal });
}
