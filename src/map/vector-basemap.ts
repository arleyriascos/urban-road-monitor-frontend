import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Vite bundles the MapLibre worker (the process that reads the map tiles) and gives its URL.
// MapLibre looks for the worker next to its own file, which no longer holds once everything is
// bundled, so it has to be told where it is.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { BASEMAP_ATTRIBUTION, BASEMAP_STYLE_URL } from './config';

setWorkerUrl(workerUrl);

/**
 * The OpenFreeMap vector basemap, drawn by MapLibre GL underneath the Leaflet layers (it goes in
 * the tile pane, below the streets and potholes).
 *
 * The binding ignores a plain "attribution" option and only reads the credit from the style once
 * it has loaded. OpenFreeMap requires its credit to be visible, so it is given explicitly through
 * "customAttribution": Leaflet's attribution control shows it as soon as the layer is added.
 */
export function addVectorBasemap(map: LeafletMap) {
  return maplibreGL({
    style: BASEMAP_STYLE_URL,
    attributionControl: { customAttribution: BASEMAP_ATTRIBUTION },
  }).addTo(map);
}
