import * as L from 'leaflet';
import { describe, expect, it, vi } from 'vitest';
import { routeFixture } from '../test/route-fixtures';
import { PANES } from './base-map';
import {
  CASING_COLOR,
  HIGHLIGHT_COLOR,
  MIN_CONNECTOR_M,
  ROUTE_COLOR,
  createRouteArrows,
  createRouteCasing,
  createRouteConnectors,
  createRouteHighlight,
  createRouteLine,
  createRoutePin,
  routeArrowIcon,
  routeBounds,
  routePinIcon,
  stepsBounds,
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

describe('createRouteCasing', () => {
  const lines = createRouteCasing(routeFixture).getLayers() as L.Polyline[];

  it('draws a wider white line under each segment of the route', () => {
    const route = createRouteLine(routeFixture).getLayers() as L.Polyline[];
    expect(lines).toHaveLength(3);
    expect(lines.every((line) => line.options.color === CASING_COLOR)).toBe(true);
    expect(lines[0].options.weight).toBeGreaterThan(route[0].options.weight ?? 0);
  });

  it('is in the route pane and lets taps through', () => {
    expect(lines.every((line) => line.options.pane === PANES.route.name)).toBe(true);
    expect(lines.every((line) => line.options.interactive === false)).toBe(true);
  });
});

describe('createRouteHighlight', () => {
  it('draws the chosen segments in violet, thicker than the route', () => {
    const lines = createRouteHighlight(
      routeFixture.route.features.slice(0, 2),
    ).getLayers() as L.Polyline[];
    const route = createRouteLine(routeFixture).getLayers() as L.Polyline[];

    expect(lines).toHaveLength(2);
    expect(lines.every((line) => line.options.color === HIGHLIGHT_COLOR)).toBe(true);
    expect(lines[0].options.weight).toBeGreaterThan(route[0].options.weight ?? 0);
    expect(lines.every((line) => line.options.pane === PANES.route.name)).toBe(true);
  });

  it('is not the route blue nor a street color', () => {
    expect(HIGHLIGHT_COLOR).not.toBe(ROUTE_COLOR);
    expect(['#1f8a5b', '#e8b800', '#ea7a1a', '#c62828']).not.toContain(HIGHLIGHT_COLOR);
  });
});

describe('route arrows', () => {
  it('turns the chevron to the bearing', () => {
    const html = String(routeArrowIcon(123.4).options.html);
    expect(html).toContain('rotate(123deg)');
    expect(html).toContain('data-bearing="123"');
  });

  it('puts one arrow on each segment, in the route pane, out of the way of taps', () => {
    const arrows = createRouteArrows(routeFixture).getLayers() as L.Marker[];

    expect(arrows).toHaveLength(3);
    expect(arrows.every((arrow) => arrow.options.pane === PANES.route.name)).toBe(true);
    expect(arrows.every((arrow) => arrow.options.interactive === false)).toBe(true);
    expect(arrows.every((arrow) => arrow.options.keyboard === false)).toBe(true);
  });

  it('places the first arrow in the middle of the first segment', () => {
    const [first] = createRouteArrows(routeFixture).getLayers() as L.Marker[];
    expect(first.getLatLng().lng).toBeCloseTo(-77.2806, 4);
    expect(first.getLatLng().lat).toBeCloseTo(1.21365, 4);
  });
});

describe('createRouteConnectors', () => {
  const click = { latitude: 1.2134, longitude: -77.2813 };
  const withDistances = (origin: number, destination: number) => ({
    ...routeFixture,
    origin: { ...routeFixture.origin, distanceM: origin },
    destination: { ...routeFixture.destination, distanceM: destination },
  });

  it('joins each click to its intersection with a dashed line', () => {
    const lines = createRouteConnectors(withDistances(30, 12), click, {
      latitude: 1.2153,
      longitude: -77.2788,
    }).getLayers() as L.Polyline[];

    expect(lines).toHaveLength(2);
    expect(lines.every((line) => Boolean(line.options.dashArray))).toBe(true);
    const [start, end] = lines[0].getLatLngs() as L.LatLng[];
    expect(start.lat).toBeCloseTo(1.2134, 6);
    expect(end.lat).toBeCloseTo(routeFixture.origin.latitude, 6);
  });

  it('skips a click that is practically on its intersection', () => {
    const lines = createRouteConnectors(withDistances(MIN_CONNECTOR_M - 0.1, 12), click, click);
    expect(lines.getLayers()).toHaveLength(1);
  });

  it('draws nothing when both clicks are on their intersections', () => {
    expect(createRouteConnectors(routeFixture, click, click).getLayers()).toHaveLength(0);
  });

  it('draws the line from 5 m on', () => {
    const lines = createRouteConnectors(withDistances(MIN_CONNECTOR_M, 0), click, click);
    expect(lines.getLayers()).toHaveLength(1);
  });
});

describe('stepsBounds', () => {
  it('covers only the given segments', () => {
    const bounds = stepsBounds([routeFixture.route.features[0]]);
    expect(bounds.getEast()).toBeCloseTo(-77.2801, 6);
    expect(bounds.getNorth()).toBeCloseTo(1.2137, 6);
  });
});
