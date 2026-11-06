import * as L from 'leaflet';
import { describe, expect, it, vi } from 'vitest';
import { routeFixture } from '../test/route-fixtures';
import { PANES } from './base-map';
import {
  ROUTE_COLOR,
  createRouteLine,
  createRoutePin,
  routeBounds,
  routePinIcon,
} from './route-layers';

describe('route pins', () => {
  it('labels the origin A and the destination B', () => {
    expect(String(routePinIcon('origin', false).options.html)).toContain('route-pin--origin');
    expect(String(routePinIcon('origin', false).options.html)).toContain('>A<');
    expect(String(routePinIcon('destination', false).options.html)).toContain('>B<');
  });

  it('marks the pin that has a problem', () => {
    expect(String(routePinIcon('destination', true).options.html)).toContain('route-pin--error');
    expect(String(routePinIcon('destination', false).options.html)).not.toContain('error');
  });

  it('places a draggable pin at the point', () => {
    const pin = createRoutePin(
      'origin',
      { latitude: 1.2136, longitude: -77.2811 },
      { onMove: vi.fn() },
    );

    expect(pin.getLatLng().lat).toBeCloseTo(1.2136, 6);
    expect(pin.getLatLng().lng).toBeCloseTo(-77.2811, 6);
    expect(pin.options.draggable).toBe(true);
    expect(pin.options.title).toBe('Origen: arrástralo para moverlo');
  });

  it('reports the new point only when the pin is dropped', () => {
    const onMove = vi.fn();
    const pin = createRoutePin('destination', { latitude: 1.2, longitude: -77.2 }, { onMove });

    pin.setLatLng([1.21, -77.29]);
    expect(onMove).not.toHaveBeenCalled();
    pin.fire('dragend');

    expect(onMove).toHaveBeenCalledWith({ latitude: 1.21, longitude: -77.29 });
  });
});

describe('createRouteLine', () => {
  const lines = createRouteLine(routeFixture).getLayers() as L.Polyline[];

  it('draws one blue line per segment, in its own pane', () => {
    expect(lines).toHaveLength(3);
    expect(lines.every((line) => line.options.color === ROUTE_COLOR)).toBe(true);
    expect(lines.every((line) => line.options.pane === PANES.route.name)).toBe(true);
  });

  it('lets taps go through to the map', () => {
    expect(lines.every((line) => line.options.interactive === false)).toBe(true);
  });

  it('keeps the travel order of the points', () => {
    const second = lines[1].getLatLngs() as L.LatLng[];
    expect(second[0].lng).toBeCloseTo(-77.2801, 6);
    expect(second[2].lng).toBeCloseTo(-77.2791, 6);
  });
});

describe('routeBounds', () => {
  it('covers the whole route and both intersections', () => {
    const bounds = routeBounds(routeFixture);
    expect(bounds.getSouth()).toBeCloseTo(1.2136, 6);
    expect(bounds.getNorth()).toBeCloseTo(1.215, 6);
    expect(bounds.getWest()).toBeCloseTo(-77.2811, 6);
    expect(bounds.getEast()).toBeCloseTo(-77.279, 6);
  });
});
