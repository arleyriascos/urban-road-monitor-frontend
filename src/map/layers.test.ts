import * as L from 'leaflet';
import { describe, expect, it, vi } from 'vitest';
import { potholesFixture, segmentsFixture } from '../test/fixtures';
import { PANES } from './base-map';
import { createPotholeLayer, createSegmentLayer, segmentPopupOptions } from './layers';

describe('createSegmentLayer', () => {
  const layers = createSegmentLayer(segmentsFixture).getLayers() as L.Polyline[];

  it('creates one line per segment', () => {
    expect(layers).toHaveLength(3);
  });

  it('draws the worst streets last, so they stay on top', () => {
    expect(layers.map((layer) => layer.options.color)).toEqual(['#22C55E', '#FACC15', '#DC2626']);
  });

  it('uses a thicker line for worse streets', () => {
    expect(layers.map((layer) => layer.options.weight)).toEqual([3, 4, 6]);
  });

  it('turns the GeoJSON [longitude, latitude] into Leaflet points', () => {
    const first = layers[0].getLatLngs() as L.LatLng[];
    expect(first[0].lat).toBeCloseTo(1.2136, 6);
    expect(first[0].lng).toBeCloseTo(-77.2811, 6);
  });

  it('opens no popups while route points are being picked', () => {
    const picking = createSegmentLayer(segmentsFixture, { popups: false }).getLayers();
    expect(picking.every((layer) => layer.getPopup() === undefined)).toBe(true);
  });

  it('opens a popup with the facts of the street', () => {
    const severe = layers[2];
    expect(String(severe.getPopup()?.getContent())).toContain('Calle sin nombre');
    expect(String(severe.getPopup()?.getContent())).toContain('Un solo sentido');
  });
});

describe('createPotholeLayer', () => {
  const layers = createPotholeLayer(potholesFixture).getLayers() as L.CircleMarker[];

  it('creates one circle per pothole', () => {
    expect(layers).toHaveLength(3);
  });

  it('places each circle at the position of the pothole', () => {
    expect(layers[0].getLatLng().lat).toBeCloseTo(1.2137, 6);
    expect(layers[0].getLatLng().lng).toBeCloseTo(-77.2795, 6);
  });

  it('uses the size, color and border that tell severity and status apart', () => {
    const [confirmed, unconfirmed] = layers;
    expect(confirmed.getRadius()).toBe(10);
    expect(confirmed.options.fillColor).toBe('#DC2626');
    expect(unconfirmed.options.dashArray).toBe('3 3');
  });

  it('draws the potholes in their own pane, above the route', () => {
    expect(layers.every((layer) => layer.options.pane === PANES.potholes.name)).toBe(true);
  });

  it('opens no popups while route points are being picked', () => {
    const picking = createPotholeLayer(potholesFixture, { popups: false }).getLayers();
    expect(picking.every((layer) => layer.getPopup() === undefined)).toBe(true);
  });

  it('opens a popup with the details of the pothole', () => {
    expect(String(layers[0].getPopup()?.getContent())).toContain('Bache grave');
  });
});

describe('the popup of a segment with a summary', () => {
  const summary = {
    segment: { id: 3, roadId: 1, roadName: 'Calle 16', position: 2, segmentsInRoad: 9 },
    radius: 2,
    window: {
      roadId: 1,
      roadName: 'Calle 16',
      fromSegmentIndex: 0,
      toSegmentIndex: 3,
      summary: {
        segments: 4,
        lengthM: 300,
        visiblePotholes: 1,
        confirmedPotholes: 1,
        damageScore: 2,
        worstSeverity: { name: 'moderado', weight: 3 },
      },
    },
    road: {
      roadId: 1,
      roadName: 'Calle 16',
      fromSegmentIndex: 0,
      toSegmentIndex: 8,
      summary: {
        segments: 9,
        lengthM: 700,
        visiblePotholes: 1,
        confirmedPotholes: 1,
        damageScore: 2,
        worstSeverity: { name: 'moderado', weight: 3 },
      },
    },
  };

  function open(layer: L.Layer): L.Popup {
    layer.openPopup(L.latLng(1.2136, -77.2811));
    const popup = layer.getPopup();
    if (!popup) throw new Error('no popup');
    return popup;
  }

  function mapWith(layer: L.GeoJSON) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const map = L.map(element, { center: [1.2136, -77.2811], zoom: 15 });
    layer.addTo(map);
    return map;
  }

  it('opens with the facts and a loading note, then adds the summary', async () => {
    let resolve: (value: typeof summary) => void = () => undefined;
    const loadSummary = vi.fn(() => new Promise<typeof summary>((done) => (resolve = done)));
    const layer = createSegmentLayer(segmentsFixture, { loadSummary });
    const map = mapWith(layer);
    const first = layer.getLayers()[0];

    const popup = open(first);
    expect(String(popup.getContent())).toContain('Cargando el resumen');
    expect(loadSummary).toHaveBeenCalledWith(1, expect.any(AbortSignal));

    resolve(summary);
    await vi.waitFor(() => expect(String(popup.getContent())).toContain('Tramo 2 de 9'));
    expect(String(popup.getContent())).toContain('Calle 16');
    map.remove();
  });

  it('keeps the facts and says so when the summary does not come', async () => {
    const loadSummary = vi.fn(async () => {
      throw new Error('down');
    });
    const layer = createSegmentLayer(segmentsFixture, { loadSummary });
    const map = mapWith(layer);

    const popup = open(layer.getLayers()[0]);
    await vi.waitFor(() => expect(String(popup.getContent())).toContain('No se pudo cargar'));
    expect(String(popup.getContent())).toContain('Doble sentido');
    map.remove();
  });

  it('shows the error when the answer does not have the expected shape', async () => {
    const loadSummary = vi.fn(async () => ({}) as unknown as typeof summary);
    const layer = createSegmentLayer(segmentsFixture, { loadSummary });
    const map = mapWith(layer);

    const popup = open(layer.getLayers()[0]);
    await vi.waitFor(() => expect(String(popup.getContent())).toContain('No se pudo cargar'));
    map.remove();
  });

  it('cancels the request when the popup closes', async () => {
    let signal: AbortSignal | undefined;
    const loadSummary = vi.fn((_id: number, abort: AbortSignal) => {
      signal = abort;
      return new Promise<typeof summary>(() => undefined);
    });
    const layer = createSegmentLayer(segmentsFixture, { loadSummary });
    const map = mapWith(layer);

    open(layer.getLayers()[0]);
    layer.getLayers()[0].closePopup();
    expect(signal?.aborted).toBe(true);
    map.remove();
  });

  it('asks nothing when there is no loader, and opens no popup while picking', () => {
    const plain = createSegmentLayer(segmentsFixture);
    expect(String(plain.getLayers()[0].getPopup()?.getContent())).not.toContain('Cargando');
    const picking = createSegmentLayer(segmentsFixture, { popups: false, loadSummary: vi.fn() });
    expect(picking.getLayers().every((layer) => layer.getPopup() === undefined)).toBe(true);
  });
});

describe('segmentPopupOptions', () => {
  it('keeps the popup clear of the controls that float over the map', () => {
    const desktop = segmentPopupOptions(false);
    const phone = segmentPopupOptions(true);
    expect((desktop.autoPanPaddingTopLeft as L.Point).y).toBeGreaterThanOrEqual(100);
    expect((phone.autoPanPaddingTopLeft as L.Point).y).toBeGreaterThan(
      (desktop.autoPanPaddingTopLeft as L.Point).y,
    );
    expect((phone.autoPanPaddingBottomRight as L.Point).y).toBeGreaterThan(60);
  });

  it('makes the popup scroll on a phone and lets it grow on a larger screen', () => {
    expect(segmentPopupOptions(true).maxHeight).toBe(380);
    expect(segmentPopupOptions(false).maxHeight).toBeUndefined();
  });
});
