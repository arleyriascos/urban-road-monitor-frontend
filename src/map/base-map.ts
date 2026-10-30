import * as L from 'leaflet';
import { MAP_CENTER, MAP_ZOOM, MAX_ZOOM, MIN_ZOOM } from './config';

/** A map centered on Pasto, ready for the streets and potholes. The basemap goes in separately. */
export function createMap(container: HTMLElement): L.Map {
  return L.map(container, {
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    // The city has about 10,000 segments: canvas draws them far faster than SVG,
    // and the tolerance makes thin streets easy to tap on a phone.
    renderer: L.canvas({ tolerance: 8 }),
  });
}
