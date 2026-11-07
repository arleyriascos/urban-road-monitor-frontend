import * as L from 'leaflet';
import type { RoutePointName } from '../lib/route-errors';
import { arrowSpots } from '../lib/route-geometry';
import type { LatLng, RouteAnswer, RouteStepFeature, RouteStepProperties } from '../types/route';
import { PANES } from './base-map';

/** Blue is not one of the street colors (green, yellow, orange, red), so the route stands out. */
export const ROUTE_COLOR = '#2563eb';
/** White edge under the route line, so it stands out over any street color. */
export const CASING_COLOR = '#ffffff';
/** The street picked in the list: violet, a color the map uses for nothing else. */
export const HIGHLIGHT_COLOR = '#7c3aed';
/** A click closer than this to its intersection gets no dashed line: it would not be seen. */
export const MIN_CONNECTOR_M = 5;

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

function lineLayer(
  steps: readonly RouteStepFeature[],
  style: L.PathOptions,
): L.GeoJSON<RouteStepProperties> {
  const collection = { type: 'FeatureCollection' as const, features: [...steps] };
  return L.geoJSON<RouteStepProperties>(collection, {
    pane: PANES.route.name,
    interactive: false,
    style: () => style,
  });
}

/** The white edge of the route. Added before the line, so the line is drawn over it. */
export function createRouteCasing(route: RouteAnswer): L.GeoJSON<RouteStepProperties> {
  return lineLayer(route.route.features, {
    color: CASING_COLOR,
    weight: 11,
    opacity: 0.95,
    lineCap: 'round',
    lineJoin: 'round',
  });
}

/** The route as one blue line per segment, already in travel order. Taps go through to the map. */
export function createRouteLine(route: RouteAnswer): L.GeoJSON<RouteStepProperties> {
  return lineLayer(route.route.features, {
    color: ROUTE_COLOR,
    weight: 6,
    opacity: 0.95,
    lineCap: 'round',
    lineJoin: 'round',
  });
}

/** The street picked in the list, drawn over the route in violet. */
export function createRouteHighlight(
  steps: readonly RouteStepFeature[],
): L.GeoJSON<RouteStepProperties> {
  return lineLayer(steps, {
    color: HIGHLIGHT_COLOR,
    weight: 9,
    opacity: 1,
    lineCap: 'round',
    lineJoin: 'round',
  });
}

/** A white chevron that points up, turned to `bearing` degrees clockwise from north. */
export function routeArrowIcon(bearing: number): L.DivIcon {
  const rotation = Math.round(bearing);
  return L.divIcon({
    className: 'route-arrow-wrapper',
    html:
      `<svg class="route-arrow" viewBox="0 0 12 12" width="14" height="14" aria-hidden="true" ` +
      `style="transform: rotate(${rotation}deg)" data-bearing="${rotation}">` +
      `<path d="M2 8.5 6 3.5l4 5" fill="none" stroke="#fff" stroke-width="2.4" ` +
      `stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

/** One arrow in the middle of each long enough segment, pointing the way of the trip. */
export function createRouteArrows(route: RouteAnswer): L.LayerGroup {
  const arrows = arrowSpots(route).map((spot) =>
    L.marker([spot.latitude, spot.longitude], {
      icon: routeArrowIcon(spot.bearing),
      pane: PANES.route.name,
      interactive: false,
      keyboard: false,
    }),
  );
  return L.layerGroup(arrows);
}

/**
 * The route starts and ends at the intersections the clicks were moved to. A dashed line joins
 * each click to its intersection, so it is clear where the route really begins and ends.
 */
export function createRouteConnectors(
  route: RouteAnswer,
  origin: LatLng,
  destination: LatLng,
): L.LayerGroup {
  const pairs: [LatLng, { latitude: number; longitude: number; distanceM: number }][] = [
    [origin, route.origin],
    [destination, route.destination],
  ];
  const lines = pairs
    .filter(([, snapped]) => snapped.distanceM >= MIN_CONNECTOR_M)
    .map(([click, snapped]) =>
      L.polyline(
        [
          [click.latitude, click.longitude],
          [snapped.latitude, snapped.longitude],
        ],
        {
          pane: PANES.route.name,
          interactive: false,
          color: ROUTE_COLOR,
          weight: 3,
          opacity: 0.9,
          dashArray: '4 7',
        },
      ),
    );
  return L.layerGroup(lines);
}

function boundsOf(points: L.LatLngTuple[]): L.LatLngBounds {
  return L.latLngBounds(points);
}

/** The area a list of segments covers. */
export function stepsBounds(steps: readonly RouteStepFeature[]): L.LatLngBounds {
  const points: L.LatLngTuple[] = [];
  for (const step of steps) {
    for (const [longitude, latitude] of step.geometry.coordinates) {
      points.push([latitude, longitude]);
    }
  }
  return boundsOf(points);
}

/** Everything the route covers: its segments and the two intersections it starts and ends at. */
export function routeBounds(route: RouteAnswer): L.LatLngBounds {
  const bounds = stepsBounds(route.route.features);
  bounds.extend([route.origin.latitude, route.origin.longitude]);
  bounds.extend([route.destination.latitude, route.destination.longitude]);
  return bounds;
}
