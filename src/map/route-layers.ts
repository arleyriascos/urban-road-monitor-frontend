import * as L from 'leaflet';
import type { RoutePointName } from '../lib/route-errors';
import type { LatLng, RouteAnswer, RouteStepProperties } from '../types/route';
import { PANES } from './base-map';

/** Blue is not one of the street colors (green, yellow, orange, red), so the route stands out. */
export const ROUTE_COLOR = '#2563eb';

const PIN_LABEL: Record<RoutePointName, string> = { origin: 'A', destination: 'B' };
const PIN_NAME: Record<RoutePointName, string> = { origin: 'Origen', destination: 'Destino' };

/** The A (green) or B (red) pin; it turns into a warning when that point has a problem. */
export function routePinIcon(kind: RoutePointName, hasError: boolean): L.DivIcon {
  const classes = `route-pin route-pin--${kind}${hasError ? ' route-pin--error' : ''}`;
  return L.divIcon({
    className: 'route-pin-wrapper',
    html: `<span class="${classes}">${PIN_LABEL[kind]}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 30],
  });
}

interface PinOptions {
  hasError?: boolean;
  /** Called when the person drops the pin somewhere else (not while dragging). */
  onMove: (point: LatLng) => void;
}

/** A draggable route point. Dropping it asks for a new route; dragging alone asks nothing. */
export function createRoutePin(
  kind: RoutePointName,
  point: LatLng,
  { hasError = false, onMove }: PinOptions,
): L.Marker {
  const marker = L.marker([point.latitude, point.longitude], {
    draggable: true,
    autoPan: true,
    keyboard: true,
    icon: routePinIcon(kind, hasError),
    title: `${PIN_NAME[kind]}: arrástralo para moverlo`,
    alt: PIN_NAME[kind],
    zIndexOffset: kind === 'destination' ? 10 : 0,
  });
  marker.on('dragend', () => {
    const position = marker.getLatLng();
    onMove({ latitude: position.lat, longitude: position.lng });
  });
  return marker;
}

/** The route as one blue line per segment, already in travel order. Taps go through to the map. */
export function createRouteLine(route: RouteAnswer): L.GeoJSON<RouteStepProperties> {
  return L.geoJSON<RouteStepProperties>(route.route, {
    pane: PANES.route.name,
    interactive: false,
    style: () => ({
      color: ROUTE_COLOR,
      weight: 6,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }),
  });
}

/** Everything the route covers: its segments and the two intersections it starts and ends at. */
export function routeBounds(route: RouteAnswer): L.LatLngBounds {
  const points: L.LatLngTuple[] = [
    [route.origin.latitude, route.origin.longitude],
    [route.destination.latitude, route.destination.longitude],
  ];
  for (const feature of route.route.features) {
    for (const [longitude, latitude] of feature.geometry.coordinates) {
      points.push([latitude, longitude]);
    }
  }
  return L.latLngBounds(points);
}
