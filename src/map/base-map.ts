import * as L from 'leaflet';
import { MAP_CENTER, MAP_ZOOM, MAX_ZOOM, MIN_ZOOM } from './config';

/**
 * Leaflet draws the layers of a pane in the order they are added. The route and the
 * potholes get panes of their own with a fixed height, so the route always goes over the
 * streets (400) and under the potholes, whatever is added or removed first.
 */
export const PANES = {
  route: { name: 'route', zIndex: 410 },
  potholes: { name: 'potholes', zIndex: 420 },
} as const;

/** A map centered on Pasto, ready for the streets and potholes. The basemap goes in separately. */
export function createMap(container: HTMLElement): L.Map {
  const map = L.map(container, {
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    // The city has about 10,000 segments: canvas draws them far faster than SVG,
    // and the tolerance makes thin streets easy to tap on a phone.
    renderer: L.canvas({ tolerance: 8 }),
  });
  for (const pane of Object.values(PANES)) {
    map.createPane(pane.name).style.zIndex = String(pane.zIndex);
  }
  return map;
}
