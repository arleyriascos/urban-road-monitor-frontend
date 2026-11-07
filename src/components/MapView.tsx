import 'leaflet/dist/leaflet.css';
import type { LatLngBounds, LeafletMouseEvent, Map as LeafletMap } from 'leaflet';
import { useEffect, useRef } from 'react';
import { createMap } from '../map/base-map';
import { attachBasemap } from '../map/basemap';
import { MAP_CENTER, MAP_ZOOM } from '../map/config';
import { createPotholeLayer, createSegmentLayer } from '../map/layers';
import {
  arrowsVisibleAt,
  coveredInsets,
  fitsInFreeArea,
  type Insets,
  type Rect,
} from '../map/view';
import {
  createRouteArrows,
  createRouteCasing,
  createRouteConnectors,
  createRouteHighlight,
  createRouteLine,
  createRoutePin,
  routeBounds,
  stepsBounds,
} from '../map/route-layers';
import { isPhoneViewport } from '../lib/viewport';
import type { RoutePointName } from '../lib/route-errors';
import type { PotholeCollection, SegmentCollection } from '../types/map';
import type { LatLng, RouteAnswer, RouteStepFeature } from '../types/route';

/** What the map needs while the "Cómo llegar" panel is open. */
export interface MapRouting {
  origin: LatLng | null;
  destination: LatLng | null;
  /** The pin to show as a problem (for example, too far from the streets). */
  errorPoint: RoutePointName | null;
  route: RouteAnswer | null;
  /** The segments of the street picked in the list; the map shows and zooms to them. */
  highlight: RouteStepFeature[] | null;
  onPick: (point: LatLng) => void;
  onMove: (which: RoutePointName, point: LatLng) => void;
}

interface MapViewProps {
  segments: SegmentCollection;
  potholes: PotholeCollection;
  showPotholes: boolean;
  /** Each time this number grows, the map goes back to the center of Pasto. */
  recenterKey: number;
  /** Null when the "Cómo llegar" panel is closed. */
  routing?: MapRouting | null;
}

/** The box of an element on the page, or null when it is not there or not shown. */
function rectOf(selector: string): Rect | null {
  const element = document.querySelector(selector);
  if (!element) return null;
  const box = element.getBoundingClientRect();
  if (box.width === 0 && box.height === 0) return null;
  return { left: box.left, top: box.top, right: box.right, bottom: box.bottom };
}

/** What the route panel and the legend cover of the map right now. */
function currentInsets(map: LeafletMap): Insets {
  const box = map.getContainer().getBoundingClientRect();
  return coveredInsets({
    map: { left: box.left, top: box.top, right: box.right, bottom: box.bottom },
    panel: rectOf('.route-panel'),
    legend: rectOf('.legend'),
    phone: isPhoneViewport(),
  });
}

/** Moves the map to show an area only if part of it is out of view or under a panel. */
function fitIfCovered(map: LeafletMap, bounds: LatLngBounds) {
  const insets = currentInsets(map);
  const size = map.getSize();
  const fits = fitsInFreeArea(
    map.latLngToContainerPoint(bounds.getNorthWest()),
    map.latLngToContainerPoint(bounds.getSouthEast()),
    { width: size.x, height: size.y },
    insets,
  );
  if (!fits) map.fitBounds(bounds, insets);
}

/**
 * The Leaflet map. Leaflet manages the DOM by itself, so React only creates and
 * removes the map and its layers; it never renders their contents.
 */
export function MapView({
  segments,
  potholes,
  showPotholes,
  recenterKey,
  routing = null,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const picking = routing !== null;
  const origin = routing?.origin ?? null;
  const destination = routing?.destination ?? null;
  const errorPoint = routing?.errorPoint ?? null;
  const route = routing?.route ?? null;
  const highlight = routing?.highlight ?? null;

  // The latest callbacks, so the map listeners never need to be added again.
  const onPickRef = useRef<MapRouting['onPick'] | undefined>(undefined);
  const onMoveRef = useRef<MapRouting['onMove'] | undefined>(undefined);
  useEffect(() => {
    onPickRef.current = routing?.onPick;
    onMoveRef.current = routing?.onMove;
  });

  // The map itself: created once, removed when the screen goes away.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const map = createMap(container);
    const basemap = attachBasemap(map);
    mapRef.current = map;
    return () => {
      basemap.cancel();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // The streets. While picking route points they open no popups, so a tap places a point.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layer = createSegmentLayer(segments, { popups: !picking }).addTo(map);
    return () => {
      layer.remove();
    };
  }, [segments, picking]);

  // The potholes go on top of the streets and the route, and can be hidden.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !showPotholes) return;
    const layer = createPotholeLayer(potholes, { popups: !picking }).addTo(map);
    return () => {
      layer.remove();
    };
  }, [potholes, showPotholes, picking]);

  // Picking route points: a tap on the map places the next point.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !picking) return;
    const container = map.getContainer();
    container.classList.add('map--picking');
    map.closePopup();
    const onClick = (event: LeafletMouseEvent) =>
      onPickRef.current?.({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    map.on('click', onClick);
    return () => {
      map.off('click', onClick);
      container.classList.remove('map--picking');
    };
  }, [picking]);

  // The A and B pins.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const pins = [
      origin &&
        createRoutePin('origin', origin, {
          hasError: errorPoint === 'origin',
          onMove: (point) => onMoveRef.current?.('origin', point),
        }),
      destination &&
        createRoutePin('destination', destination, {
          hasError: errorPoint === 'destination',
          onMove: (point) => onMoveRef.current?.('destination', point),
        }),
    ].filter((pin) => pin !== null);
    pins.forEach((pin) => pin.addTo(map));
    return () => {
      pins.forEach((pin) => pin.remove());
    };
  }, [origin, destination, errorPoint]);

  // The route: a white edge and the blue line over it. The map moves to show it only when part
  // of it is out of view.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !route) return;
    const casing = createRouteCasing(route).addTo(map);
    const line = createRouteLine(route).addTo(map);
    const bounds = routeBounds(route);
    fitIfCovered(map, bounds);
    return () => {
      line.remove();
      casing.remove();
    };
  }, [route]);

  // The arrows that show the way of the trip.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !route) return;
    const arrows = createRouteArrows(route).addTo(map);
    return () => {
      arrows.remove();
    };
  }, [route]);

  // The arrows crowd into what looks like a dashed line when the map is far away, so they only
  // show when it is zoomed in (the CSS hides them while the map has the "far" class).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !route) return;
    const container = map.getContainer();
    const update = () => container.classList.toggle('map--far', !arrowsVisibleAt(map.getZoom()));
    update();
    map.on('zoomend', update);
    return () => {
      map.off('zoomend', update);
      container.classList.remove('map--far');
    };
  }, [route]);

  // A dashed line from each click to the intersection where the route really starts or ends.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !route || !origin || !destination) return;
    const connectors = createRouteConnectors(route, origin, destination).addTo(map);
    return () => {
      connectors.remove();
    };
  }, [route, origin, destination]);

  // The street picked in the list goes over the route and the map zooms to it; when it is
  // let go, the map shows the whole route again.
  const hadHighlight = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !route) return;
    if (!highlight) {
      if (hadHighlight.current) map.fitBounds(routeBounds(route), currentInsets(map));
      hadHighlight.current = false;
      return;
    }
    hadHighlight.current = true;
    const layer = createRouteHighlight(highlight).addTo(map);
    map.fitBounds(stepsBounds(highlight), { ...currentInsets(map), maxZoom: 18 });
    return () => {
      layer.remove();
    };
  }, [route, highlight]);

  useEffect(() => {
    if (recenterKey > 0) mapRef.current?.setView(MAP_CENTER, MAP_ZOOM);
  }, [recenterKey]);

  return <div ref={containerRef} className="map" role="region" aria-label="Mapa del estado vial" />;
}
