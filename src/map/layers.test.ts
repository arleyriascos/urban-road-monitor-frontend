import * as L from 'leaflet';
import { describe, expect, it } from 'vitest';
import { potholesFixture, segmentsFixture } from '../test/fixtures';
import { createPotholeLayer, createSegmentLayer } from './layers';

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

  it('opens a popup with the details of the pothole', () => {
    expect(String(layers[0].getPopup()?.getContent())).toContain('Bache grave');
  });
});
