import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import type { MapData } from '../hooks/useMapData';
import { useRoute, type RouteState } from '../hooks/useRoute';
import { potholesFixture, segmentsFixture, statsFixture } from '../test/fixtures';
import { routeFixture } from '../test/route-fixtures';
import type { PotholeCollection } from '../types/map';
import { MapScreen } from './MapScreen';
import type { MapRouting } from './MapView';

// Leaflet needs a real layout to work, so the map is replaced by a marker that
// shows what the screen gave it.
// It also offers buttons that do what a tap or a dropped pin would do on the real map.
vi.mock('./MapView', () => ({
  MapView: (props: {
    potholes: PotholeCollection;
    showPotholes: boolean;
    recenterKey: number;
    routing: MapRouting | null;
  }) => (
    <div
      data-testid="map"
      data-potholes={props.potholes.features.length}
      data-show={String(props.showPotholes)}
      data-recenter={props.recenterKey}
      data-picking={String(props.routing !== null)}
      data-origin={JSON.stringify(props.routing?.origin ?? null)}
      data-destination={JSON.stringify(props.routing?.destination ?? null)}
      data-error-point={String(props.routing?.errorPoint ?? null)}
      data-route-steps={String(props.routing?.route?.summary.steps ?? 0)}
      data-highlight={String(props.routing?.highlight?.length ?? 0)}
    >
      {props.routing ? (
        <>
          <button type="button" onClick={() => props.routing?.onPick(P1)}>
            tap 1
          </button>
          <button type="button" onClick={() => props.routing?.onPick(P2)}>
            tap 2
          </button>
          <button type="button" onClick={() => props.routing?.onPick(P3)}>
            tap 3
          </button>
          <button type="button" onClick={() => props.routing?.onMove('destination', P3)}>
            drop B
          </button>
        </>
      ) : null}
    </div>
  ),
}));

vi.mock('../hooks/useRoute', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../hooks/useRoute')>()),
  useRoute: vi.fn(),
}));

const P1 = { latitude: 1.21, longitude: -77.28 };
const P2 = { latitude: 1.22, longitude: -77.27 };
const P3 = { latitude: 1.23, longitude: -77.26 };

const data: MapData = { segments: segmentsFixture, potholes: potholesFixture, stats: statsFixture };

const map = () => screen.getByTestId('map');
const retry = vi.fn();

function routeState(state: RouteState) {
  vi.mocked(useRoute).mockReturnValue({ state, retry, requestKey: 'request' });
}

/** The arguments of the last useRoute call: origin, destination and criterion. */
const lastRouteRequest = () => vi.mocked(useRoute).mock.lastCall?.slice(0, 3);

beforeEach(() => {
  vi.mocked(useRoute).mockReset();
  routeState({ status: 'idle' });
});

describe('MapScreen', () => {
  it('shows the top bar, the map and the legend', () => {
    render(<MapScreen data={data} />);
    expect(screen.getByText('4.610 vías · 774,1 km · 54 baches activos')).toBeTruthy();
    expect(map()).toBeTruthy();
    expect(screen.getByRole('complementary', { name: 'Leyenda del mapa' })).toBeTruthy();
  });

  it('shows the potholes except the repaired ones at first', () => {
    render(<MapScreen data={data} />);
    expect(map().dataset.show).toBe('true');
    expect(map().dataset.potholes).toBe('2');
  });

  it('includes the repaired potholes when asked', () => {
    render(<MapScreen data={data} />);
    fireEvent.click(screen.getByLabelText(/Incluir reparados/));
    expect(map().dataset.potholes).toBe('3');
  });

  it('hides the potholes with the switch', () => {
    render(<MapScreen data={data} />);
    fireEvent.click(screen.getByLabelText('Mostrar baches'));
    expect(map().dataset.show).toBe('false');
  });

  it('asks the map to go back to the center with the recenter button', () => {
    render(<MapScreen data={data} />);
    expect(map().dataset.recenter).toBe('0');
    fireEvent.click(screen.getByRole('button', { name: /Centrar el mapa/ }));
    expect(map().dataset.recenter).toBe('1');
  });
});

describe('MapScreen "Cómo llegar"', () => {
  const open = () => fireEvent.click(screen.getByRole('button', { name: 'Cómo llegar' }));
  const tap = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

  it('opens the panel and lets the map pick points', () => {
    render(<MapScreen data={data} />);
    expect(map().dataset.picking).toBe('false');

    open();

    expect(screen.getByRole('region', { name: 'Cómo llegar' })).toBeTruthy();
    expect(map().dataset.picking).toBe('true');
  });

  it('places A with the first tap, B with the second, and asks for the route', () => {
    render(<MapScreen data={data} />);
    open();

    tap('tap 1');
    expect(lastRouteRequest()).toEqual([P1, null, 'balanced']);
    tap('tap 2');

    expect(lastRouteRequest()).toEqual([P1, P2, 'balanced']);
    expect(map().dataset.origin).toBe(JSON.stringify(P1));
    expect(map().dataset.destination).toBe(JSON.stringify(P2));
  });

  it('starts another route with a tap after both points are placed', () => {
    render(<MapScreen data={data} />);
    open();
    tap('tap 1');
    tap('tap 2');

    tap('tap 3');

    expect(lastRouteRequest()).toEqual([P3, null, 'balanced']);
  });

  it('moves a point when its pin is dropped somewhere else', () => {
    render(<MapScreen data={data} />);
    open();
    tap('tap 1');
    tap('tap 2');

    tap('drop B');

    expect(lastRouteRequest()).toEqual([P1, P3, 'balanced']);
  });

  it('asks again with another criterion', () => {
    render(<MapScreen data={data} />);
    open();
    tap('tap 1');
    tap('tap 2');

    fireEvent.click(screen.getByRole('button', { name: 'Evitar baches' }));

    expect(lastRouteRequest()).toEqual([P1, P2, 'avoid_potholes']);
  });

  it('swaps A and B, and clears them', () => {
    render(<MapScreen data={data} />);
    open();
    tap('tap 1');
    tap('tap 2');

    fireEvent.click(screen.getByRole('button', { name: 'Intercambiar A y B' }));
    expect(lastRouteRequest()).toEqual([P2, P1, 'balanced']);
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
    expect(lastRouteRequest()).toEqual([null, null, 'balanced']);
  });

  it('gives the route to the map when it arrives', () => {
    routeState({ status: 'success', route: routeFixture });
    render(<MapScreen data={data} />);
    open();

    expect(map().dataset.routeSteps).toBe('3');
  });

  it('marks on the map the point that is too far from the streets', () => {
    routeState({
      status: 'error',
      error: new ApiError('http', 'x', 422, 'OUTSIDE_NETWORK', { point: 'destination' }),
    });
    render(<MapScreen data={data} />);
    open();

    expect(map().dataset.errorPoint).toBe('destination');
  });

  it('retries from the panel', () => {
    routeState({ status: 'error', error: new ApiError('network', 'x') });
    render(<MapScreen data={data} />);
    open();

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(retry).toHaveBeenCalledOnce();
  });

  it('closing the panel clears the points and gives the taps back to the map', () => {
    render(<MapScreen data={data} />);
    open();
    tap('tap 1');

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar Cómo llegar' }));

    expect(map().dataset.picking).toBe('false');
    expect(lastRouteRequest()).toEqual([null, null, 'balanced']);
    expect(screen.getByRole('button', { name: 'Cómo llegar' })).toBeTruthy();
  });

  it('marks the screen while the panel is open, so phones can hide the legend', () => {
    const { container } = render(<MapScreen data={data} />);
    expect(container.querySelector('.map-app--routing')).toBeNull();

    open();

    expect(container.querySelector('.map-app--routing')).not.toBeNull();
  });

  describe('street by street', () => {
    // A route only exists once both points are placed, so the two taps come first.
    const arrive = () => {
      routeState({ status: 'success', route: routeFixture });
      const view = render(<MapScreen data={data} />);
      open();
      tap('tap 1');
      tap('tap 2');
      return view;
    };

    it('shows the streets of the route, with none picked and nothing highlighted', () => {
      arrive();

      expect(screen.getByRole('button', { name: /Calle 18/ })).toBeTruthy();
      expect(map().dataset.highlight).toBe('0');
    });

    it('highlights on the map the segments of the street picked', () => {
      arrive();

      fireEvent.click(screen.getByRole('button', { name: /Calle 18/ }));

      expect(map().dataset.highlight).toBe('2');
      expect(screen.getByText('Calle 1 de 2')).toBeTruthy();
    });

    it('walks through the streets with Siguiente and Anterior', () => {
      arrive();

      fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
      expect(screen.getByText('Calle 1 de 2')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
      expect(screen.getByText('Calle 2 de 2')).toBeTruthy();
      expect(map().dataset.highlight).toBe('1');
      fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));

      expect(screen.getByText('Calle 1 de 2')).toBeTruthy();
      expect(map().dataset.highlight).toBe('2');
    });

    it('goes back to the whole route', () => {
      arrive();
      fireEvent.click(screen.getByRole('button', { name: /Calle 18/ }));

      fireEvent.click(screen.getByRole('button', { name: 'Ver toda la ruta' }));

      expect(map().dataset.highlight).toBe('0');
    });

    it('starts a new route without a street picked', () => {
      const { rerender } = arrive();
      fireEvent.click(screen.getByRole('button', { name: /Calle 18/ }));
      expect(map().dataset.highlight).toBe('2');

      routeState({ status: 'success', route: { ...routeFixture } });
      rerender(<MapScreen data={data} />);

      expect(map().dataset.highlight).toBe('0');
      expect(screen.getByText('Recorre la ruta')).toBeTruthy();
    });

    it('highlights nothing when there is no route', () => {
      routeState({ status: 'loading' });
      render(<MapScreen data={data} />);
      open();

      expect(map().dataset.highlight).toBe('0');
      expect(screen.queryByRole('region', { name: 'Recorrido de la ruta' })).toBeNull();
    });
  });
});
