import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap } from 'leaflet';
import { useEffect, useRef } from 'react';
import { createMap } from '../map/base-map';
import { attachBasemap } from '../map/basemap';
import { MAP_CENTER, MAP_ZOOM } from '../map/config';
import { createPotholeLayer, createSegmentLayer } from '../map/layers';
import type { PotholeCollection, SegmentCollection } from '../types/map';

interface MapViewProps {
  segments: SegmentCollection;
  potholes: PotholeCollection;
  showPotholes: boolean;
  /** Each time this number grows, the map goes back to the center of Pasto. */
  recenterKey: number;
}

/**
 * The Leaflet map. Leaflet manages the DOM by itself, so React only creates and
 * removes the map and its layers; it never renders their contents.
 */
export function MapView({ segments, potholes, showPotholes, recenterKey }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

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

  // The streets.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layer = createSegmentLayer(segments).addTo(map);
    return () => {
      layer.remove();
    };
  }, [segments]);

  // The potholes go on top of the streets, and can be hidden.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !showPotholes) return;
    const layer = createPotholeLayer(potholes).addTo(map);
    return () => {
      layer.remove();
    };
  }, [potholes, showPotholes]);

  useEffect(() => {
    if (recenterKey > 0) mapRef.current?.setView(MAP_CENTER, MAP_ZOOM);
  }, [recenterKey]);

  return <div ref={containerRef} className="map" role="region" aria-label="Mapa del estado vial" />;
}
