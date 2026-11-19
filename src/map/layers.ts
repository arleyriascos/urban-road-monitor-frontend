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
import { defaultTexts, type Texts } from '../lib/translator';
import { isPhoneViewport } from '../lib/viewport';
import type {
  PotholeCollection,
  PotholeProperties,
  SegmentCollection,
  SegmentProperties,
} from '../types/map';

const POPUP_OPTIONS: L.PopupOptions = { maxWidth: 280 };

/**
 * The street popup is tall, and the search box, "Directions" and the legend float over the map.
 * When a popup opens the map moves so it stays clear of them, and on a phone the popup scrolls
 * instead of growing past the screen.
 */
export function segmentPopupOptions(phone: boolean): L.PopupOptions {
  return {
    ...POPUP_OPTIONS,
    autoPanPaddingTopLeft: L.point(8, phone ? 140 : 110),
    autoPanPaddingBottomRight: L.point(8, phone ? 76 : 12),
    maxHeight: phone ? 380 : undefined,
  };
}

export interface LayerOptions {
  /** False while the person picks route points: a tap must place a point, not open a popup. */
  popups?: boolean;
  /** The language of the popups. Spanish when none is given. */
  texts?: Texts;
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
  { popups = true, loadSummary, texts = defaultTexts }: SegmentLayerOptions = {},
): L.GeoJSON<SegmentProperties> {
  const sorted: SegmentCollection = {
    ...collection,
    features: sortBySeverity(collection.features),
  };

  return L.geoJSON<SegmentProperties>(sorted, {
    style: (feature) => (feature ? segmentStyle(feature.properties) : {}),
    onEachFeature: (feature, layer) => {
      if (!popups) return;
      const segmentId = Number(feature.id);
      const popupWith = (extra = '') => segmentPopupHtml(feature.properties, extra, texts);
      if (!loadSummary || !Number.isFinite(segmentId)) {
        layer.bindPopup(popupWith(), POPUP_OPTIONS);
        return;
      }
      layer.bindPopup(popupWith(summaryLoadingHtml(texts)), segmentPopupOptions(isPhoneViewport()));

      // Each time the popup opens it asks for the summary; closing it cancels the request.
      let pending: AbortController | null = null;
      layer.on('popupopen', (event: L.PopupEvent) => {
        pending?.abort();
        const mine = new AbortController();
        pending = mine;
        event.popup.setContent(popupWith(summaryLoadingHtml(texts)));
        loadSummary(segmentId, mine.signal).then(
          (answer) => {
            if (mine.signal.aborted) return;
            let html: string;
            try {
              html = segmentSummaryHtml(answer, texts);
            } catch {
              // An answer that does not have the expected shape must not leave "Loading…" forever.
              html = summaryErrorHtml(texts);
            }
            event.popup.setContent(popupWith(html));
          },
          () => {
            if (!mine.signal.aborted) event.popup.setContent(popupWith(summaryErrorHtml(texts)));
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
  { popups = true, texts = defaultTexts }: LayerOptions = {},
): L.GeoJSON<PotholeProperties> {
  return L.geoJSON<PotholeProperties>(collection, {
    pointToLayer: (feature, latlng) =>
      L.circleMarker(latlng, {
        ...potholeMarkerStyle(feature.properties),
        pane: PANES.potholes.name,
      }),
    onEachFeature: (feature, layer) => {
      if (popups) layer.bindPopup(potholePopupHtml(feature.properties, texts), POPUP_OPTIONS);
    },
  });
}
