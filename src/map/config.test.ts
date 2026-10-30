import { describe, expect, it } from 'vitest';
import { BASEMAP_ATTRIBUTION, BASEMAP_STYLE_URL, MAP_CENTER, MAP_ZOOM } from './config';

describe('basemap configuration', () => {
  it('uses the Positron style of OpenFreeMap', () => {
    expect(BASEMAP_STYLE_URL).toBe('https://tiles.openfreemap.org/styles/positron');
  });

  it('needs no API key: the frontend must never carry one', () => {
    expect(BASEMAP_STYLE_URL).not.toMatch(/key|token/i);
  });

  it('credits OpenFreeMap, OpenMapTiles and OpenStreetMap, with links', () => {
    expect(BASEMAP_ATTRIBUTION).toContain('OpenFreeMap');
    expect(BASEMAP_ATTRIBUTION).toContain('OpenMapTiles');
    expect(BASEMAP_ATTRIBUTION).toContain('OpenStreetMap');
    expect(BASEMAP_ATTRIBUTION).toContain('https://openfreemap.org');
    expect(BASEMAP_ATTRIBUTION).toContain('https://www.openstreetmap.org/copyright');
  });

  it('opens the external links safely', () => {
    expect(BASEMAP_ATTRIBUTION).toContain('rel="noopener"');
  });
});

describe('map view configuration', () => {
  it('starts centered on the Plaza de Nariño at zoom 14', () => {
    expect(MAP_CENTER).toEqual([1.2136, -77.2811]);
    expect(MAP_ZOOM).toBe(14);
  });
});
