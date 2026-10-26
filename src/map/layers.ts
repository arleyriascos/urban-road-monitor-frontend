import * as L from 'leaflet';
import { potholeMarkerStyle, segmentStyle, sortBySeverity } from '../lib/map-styles';
import { potholePopupHtml, segmentPopupHtml } from '../lib/popups';
import type {
  PotholeCollection,
  PotholeProperties,
  SegmentCollection,
  SegmentProperties,
} from '../types/map';

const POPUP_OPTIONS: L.PopupOptions = { maxWidth: 260 };

/** The streets, colored by state. The worst ones are added last so they are drawn on top. */
export function createSegmentLayer(collection: SegmentCollection): L.GeoJSON<SegmentProperties> {
  const sorted: SegmentCollection = {
    ...collection,
    features: sortBySeverity(collection.features),
  };

  return L.geoJSON<SegmentProperties>(sorted, {
    style: (feature) => (feature ? segmentStyle(feature.properties) : {}),
    onEachFeature: (feature, layer) => {
      layer.bindPopup(segmentPopupHtml(feature.properties), POPUP_OPTIONS);
    },
  });
}

/** One circle per pothole: its size shows the severity and its border the status. */
export function createPotholeLayer(collection: PotholeCollection): L.GeoJSON<PotholeProperties> {
  return L.geoJSON<PotholeProperties>(collection, {
    pointToLayer: (feature, latlng) =>
      L.circleMarker(latlng, potholeMarkerStyle(feature.properties)),
    onEachFeature: (feature, layer) => {
      layer.bindPopup(potholePopupHtml(feature.properties), POPUP_OPTIONS);
    },
  });
}
