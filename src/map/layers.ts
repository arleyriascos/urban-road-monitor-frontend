import * as L from 'leaflet';
import { potholeMarkerStyle, segmentStyle, sortBySeverity } from '../lib/map-styles';
import { PANES } from './base-map';
import {
  potholePopupHtml,
  segmentPopupHtml,
  segmentSummaryHtml,
  summaryErrorHtml,
  summaryLoadingHtml,
} from '../lib/popups';
import type { SummaryLoader } from '../lib/summary-cache';
import type {
  PotholeCollection,
  PotholeProperties,
  SegmentCollection,
  SegmentProperties,
} from '../types/map';

const POPUP_OPTIONS: L.PopupOptions = { maxWidth: 260 };

export interface LayerOptions {
  /** False while the person picks route points: a tap must place a point, not open a popup. */
  popups?: boolean;
}

export interface SegmentLayerOptions extends LayerOptions {
  /**
   * Gives the summary of the street around a segment. When there is one, the popup opens at
   * once with the facts it already has and the summary is added when it arrives.
   */
  loadSummary?: SummaryLoader;
}

/** The streets, colored by state. The worst ones are added last so they are drawn on top. */
export function createSegmentLayer(
  collection: SegmentCollection,
  { popups = true, loadSummary }: SegmentLayerOptions = {},
): L.GeoJSON<SegmentProperties> {
  const sorted: SegmentCollection = {
    ...collection,
    features: sortBySeverity(collection.features),
  };

  return L.geoJSON<SegmentProperties>(sorted, {
    style: (feature) => (feature ? segmentStyle(feature.properties) : {}),
    onEachFeature: (feature, layer) => {
      if (!popups) return;
      const facts = segmentPopupHtml(feature.properties);
      const segmentId = Number(feature.id);
      if (!loadSummary || !Number.isFinite(segmentId)) {
        layer.bindPopup(facts, POPUP_OPTIONS);
        return;
      }
      layer.bindPopup(facts + summaryLoadingHtml(), POPUP_OPTIONS);

      // Each time the popup opens it asks for the summary; closing it cancels the request.
      let pending: AbortController | null = null;
      layer.on('popupopen', (event: L.PopupEvent) => {
        pending?.abort();
        const mine = new AbortController();
        pending = mine;
        event.popup.setContent(facts + summaryLoadingHtml());
        loadSummary(segmentId, mine.signal).then(
          (answer) => {
            if (!mine.signal.aborted) event.popup.setContent(facts + segmentSummaryHtml(answer));
          },
          () => {
            if (!mine.signal.aborted) event.popup.setContent(facts + summaryErrorHtml());
          },
        );
      });
      layer.on('popupclose', () => {
        pending?.abort();
        pending = null;
      });
    },
  });
}

/** One circle per pothole: its size shows the severity and its border the status. */
export function createPotholeLayer(
  collection: PotholeCollection,
  { popups = true }: LayerOptions = {},
): L.GeoJSON<PotholeProperties> {
  return L.geoJSON<PotholeProperties>(collection, {
    pointToLayer: (feature, latlng) =>
      L.circleMarker(latlng, {
        ...potholeMarkerStyle(feature.properties),
        pane: PANES.potholes.name,
      }),
    onEachFeature: (feature, layer) => {
      if (popups) layer.bindPopup(potholePopupHtml(feature.properties), POPUP_OPTIONS);
    },
  });
}
