import type { NetworkStats, PotholeCollection, SegmentCollection } from '../types/map';
import { getJson } from './http';

/** Every road segment of the city, with the color of its state (about 3 MB, gzip on the wire). */
export function getRoadSegments(signal?: AbortSignal): Promise<SegmentCollection> {
  return getJson<SegmentCollection>('/api/road-segments', { signal });
}

/** Consolidated potholes. Repaired ones are only included when asked for. */
export function getPotholes(
  options: { includeRepaired: boolean },
  signal?: AbortSignal,
): Promise<PotholeCollection> {
  const query = options.includeRepaired ? '?includeRepaired=true' : '';
  return getJson<PotholeCollection>(`/api/potholes${query}`, { signal });
}

/** Totals and legend numbers of the map. */
export function getNetworkStats(signal?: AbortSignal): Promise<NetworkStats> {
  return getJson<NetworkStats>('/api/road-network/stats', { signal });
}
