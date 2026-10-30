import type { LatLngTuple } from 'leaflet';

/** Plaza de Nariño, the main square of Pasto. */
export const MAP_CENTER: LatLngTuple = [1.2136, -77.2811];
export const MAP_ZOOM = 14;
export const MIN_ZOOM = 11;
export const MAX_ZOOM = 19;

/** CARTO "light" basemap, built on OpenStreetMap data. The attribution must stay visible. */
export const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
export const TILE_SUBDOMAINS = 'abcd';
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * OpenFreeMap "Positron": a light, muted vector basemap built on OpenStreetMap data. It needs no
 * API key (the frontend must never carry one) and has no request limits.
 */
export const BASEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

/** OpenFreeMap requires this credit to stay visible on the map. */
export const BASEMAP_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> ' +
  '&copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> ' +
  'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
