import * as L from 'leaflet';
import type { SegmentCollection } from '../types/map';
import type { StreetBounds } from '../types/roads';
import { PANES } from './base-map';

/** Magenta: no street state, route or pothole uses it, so it stands out on any of them. */
export const STREET_COLOR = '#c026d3';

/** The segments that belong to the street that was found. */
export function streetFeatures(
  segments: SegmentCollection,
  roadIds: readonly number[],
): SegmentCollection {
  const wanted = new Set(roadIds);
  return {
    type: 'FeatureCollection',
    features: segments.features.filter((feature) => wanted.has(feature.properties.roadId)),
  };
}

/**
 * The street found by the search, drawn over the others: a white edge and the magenta line
 * on top. It takes no taps, so the street underneath still opens its popup.
 */
export function createStreetHighlight(
  segments: SegmentCollection,
  roadIds: readonly number[],
): L.LayerGroup {
  const street = streetFeatures(segments, roadIds);
  const common = {
    pane: PANES.route.name,
    interactive: false,
    lineCap: 'round',
    lineJoin: 'round',
  } as const;
  return L.layerGroup([
    L.geoJSON(street, {
      style: () => ({ ...common, color: '#ffffff', weight: 13, opacity: 0.95 }),
    }),
    L.geoJSON(street, { style: () => ({ ...common, color: STREET_COLOR, weight: 8, opacity: 1 }) }),
  ]);
}

/** The box of the street, for the map to show all of it. */
export function streetBounds(bounds: StreetBounds): L.LatLngBounds {
  return L.latLngBounds(
    [bounds.minLatitude, bounds.minLongitude],
    [bounds.maxLatitude, bounds.maxLongitude],
  );
}
