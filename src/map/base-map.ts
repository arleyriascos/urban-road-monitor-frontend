import * as L from 'leaflet';
import {
  MAP_CENTER,
  MAP_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  TILE_ATTRIBUTION,
  TILE_SUBDOMAINS,
  TILE_URL,
} from './config';

/** A map centered on Pasto with the CARTO basemap, ready for the streets and potholes. */
export function createBaseMap(container: HTMLElement): L.Map {
  const map = L.map(container, {
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    // The city has about 10,000 segments: canvas draws them far faster than SVG,
    // and the tolerance makes thin streets easy to tap on a phone.
    renderer: L.canvas({ tolerance: 8 }),
  });

  L.tileLayer(TILE_URL, {
    attribution: TILE_ATTRIBUTION,
    subdomains: TILE_SUBDOMAINS,
    maxZoom: 20,
  }).addTo(map);

  return map;
}
