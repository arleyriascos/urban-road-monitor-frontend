import * as L from 'leaflet';
import { describe, expect, it } from 'vitest';
import { segmentsFixture } from '../test/fixtures';
import { PANES } from './base-map';
import { createStreetHighlight, STREET_COLOR, streetBounds, streetFeatures } from './street-layers';

const roadIds = [...new Set(segmentsFixture.features.map((f) => f.properties.roadId))];

describe('streetFeatures', () => {
  it('keeps only the segments of the street found', () => {
    const wanted = roadIds[0];
    const kept = streetFeatures(segmentsFixture, [wanted]);
    expect(kept.features.length).toBeGreaterThan(0);
    expect(kept.features.every((f) => f.properties.roadId === wanted)).toBe(true);
  });

  it('keeps the segments of all the ways of the street', () => {
    expect(streetFeatures(segmentsFixture, roadIds).features).toHaveLength(
      segmentsFixture.features.length,
    );
  });

  it('is empty when no way matches', () => {
    expect(streetFeatures(segmentsFixture, [-1]).features).toEqual([]);
    expect(streetFeatures(segmentsFixture, []).features).toEqual([]);
  });
});

describe('createStreetHighlight', () => {
  const group = createStreetHighlight(segmentsFixture, roadIds);
  const [edge, line] = group.getLayers() as L.GeoJSON[];
  const first = (layer: L.GeoJSON) => layer.getLayers()[0] as L.Polyline;

  it('draws a white edge under a magenta line', () => {
    expect(first(edge).options.color).toBe('#ffffff');
    expect(first(line).options.color).toBe(STREET_COLOR);
    expect(first(edge).options.weight).toBeGreaterThan(first(line).options.weight ?? 0);
  });

  it('draws one line per segment of the street, in the route pane', () => {
    expect(line.getLayers()).toHaveLength(segmentsFixture.features.length);
    expect(first(line).options.pane).toBe(PANES.route.name);
  });

  it('takes no taps, so the street underneath keeps its popup', () => {
    expect(first(edge).options.interactive).toBe(false);
    expect(first(line).options.interactive).toBe(false);
  });
});

describe('streetBounds', () => {
  it('turns the box of the answer into Leaflet bounds', () => {
    const bounds = streetBounds({
      minLatitude: 1.211,
      maxLatitude: 1.216,
      minLongitude: -77.284,
      maxLongitude: -77.278,
    });
    expect(bounds.getSouth()).toBe(1.211);
    expect(bounds.getNorth()).toBe(1.216);
    expect(bounds.getWest()).toBe(-77.284);
    expect(bounds.getEast()).toBe(-77.278);
  });
});
