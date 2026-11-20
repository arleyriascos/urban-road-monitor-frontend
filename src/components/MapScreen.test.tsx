import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import { searchStreets } from '../api/roads';
import type { MapData } from '../hooks/useMapData';
import { useRoute, type RouteState } from '../hooks/useRoute';
import { renderInEnglish } from '../test/english';
import { potholesFixture, segmentsFixture, statsFixture } from '../test/fixtures';
import { routeFixture } from '../test/route-fixtures';
import type { PotholeCollection } from '../types/map';
import type { StreetMatch } from '../types/roads';
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
    street?: StreetMatch | null;
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
      data-street={props.street?.name ?? ''}
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

vi.mock('../api/roads', () => ({ searchStreets: vi.fn(), getSegmentSummary: vi.fn() }));

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
    expect(screen.getByRole('list', { name: 'Resumen de la ciudad' }).textContent).toBe(
      '4.610 vías774,1 km54 baches activos',
    );
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

    it('goes around the streets: Siguiente after the last one returns to the first', () => {
      arrive();

      fireEvent.click(screen.getByRole('button', { name: /Calle sin nombre/ }));
      expect(screen.getByText('Calle 2 de 2')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

      expect(screen.getByText('Calle 1 de 2')).toBeTruthy();
      expect(map().dataset.highlight).toBe('2');
    });

    it('goes to the last street with Anterior when none is picked', () => {
      arrive();

      fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));

      expect(screen.getByText('Calle 2 de 2')).toBeTruthy();
      expect(map().dataset.highlight).toBe('1');
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

describe('MapScreen street search', () => {
  const found: StreetMatch = {
    name: 'Calle 18',
    roadIds: [7, 12],
    segments: 24,
    center: { latitude: 1.2136, longitude: -77.2811 },
    bounds: {
      minLatitude: 1.211,
      maxLatitude: 1.216,
      minLongitude: -77.284,
      maxLongitude: -77.278,
    },
  };
  const box = () => {
    if (!screen.queryByRole('combobox')) {
      fireEvent.click(screen.getByRole('button', { name: 'Buscar una calle' }));
    }
    return screen.getByRole('combobox', { name: 'Buscar una calle' });
  };

  async function pickStreet() {
    vi.mocked(searchStreets).mockResolvedValue({ query: 'cal', streets: [found] });
    fireEvent.change(box(), { target: { value: 'cal' } });
    fireEvent.click(await screen.findByRole('option', { name: /Calle 18/ }));
  }

  it('has the magnifier in the top bar, which opens the box, and no street highlighted at first', () => {
    render(<MapScreen data={data} />);
    const toggle = screen.getByRole('button', { name: 'Buscar una calle' });
    expect(toggle.closest('header')).toBeTruthy();
    expect(box()).toBeTruthy();
    expect(map().dataset.street).toBe('');
  });

  it('gives the street that was picked to the map', async () => {
    render(<MapScreen data={data} />);
    await pickStreet();
    expect(map().dataset.street).toBe('Calle 18');
    expect(vi.mocked(searchStreets).mock.calls[0][0]).toBe('cal');
  });

  it('lets the street go when the box is cleared', async () => {
    render(<MapScreen data={data} />);
    await pickStreet();
    fireEvent.click(screen.getByRole('button', { name: 'Buscar una calle' }));
    fireEvent.click(screen.getByRole('button', { name: 'Borrar búsqueda' }));
    await waitFor(() => expect(map().dataset.street).toBe(''));
  });

  it('does not show the street on the map while the "Cómo llegar" panel is open', async () => {
    render(<MapScreen data={data} />);
    await pickStreet();
    fireEvent.click(screen.getByRole('button', { name: 'Cómo llegar' }));
    expect(map().dataset.street).toBe('');
  });
});

describe('MapScreen camera button', () => {
  it('is a camera icon with no words, at the map, that goes to the detector', () => {
    render(<MapScreen data={data} />);
    const camera = screen.getByRole('link', { name: 'Detector de baches' });
    expect(camera.getAttribute('href')).toBe('/camara');
    expect(camera.textContent).toBe('');
    expect(camera.closest('header')).toBeNull();
  });
});

describe('MapScreen in English', () => {
  /** Words that only a Spanish text has: none of them may be left on an English screen. */
  const SPANISH =
    /\b(Cómo|llegar|Leyenda|Baches|baches|Calles|calles|Centrar|Mostrar|Capas|Origen|Destino|Limpiar|Criterio|Detalles|Tramos?|Algoritmo|Siguiente|Anterior|Ruta|Intercambiar|vías)\b/;

  /** Everything a person reads or hears: the text and the labels of the elements. */
  function readableText(): string {
    const labels = [...document.querySelectorAll('[aria-label], [title], [placeholder]')].flatMap(
      (element) => ['aria-label', 'title', 'placeholder'].map((name) => element.getAttribute(name)),
    );
    return [document.body.textContent, ...labels].filter(Boolean).join(' | ');
  }

  it('shows the top bar, the map and the legend in English', () => {
    renderInEnglish(<MapScreen data={data} />);
    expect(screen.getByRole('list', { name: 'City summary' }).textContent).toBe(
      '4,610 roads774.1 km54 active potholes',
    );
    expect(screen.getByRole('complementary', { name: 'Map legend' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Directions' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Center the map/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Pothole detector' }).getAttribute('href')).toBe(
      '/camara',
    );
    expect(screen.getByRole('button', { name: 'Search for a street' })).toBeTruthy();
    expect(screen.getByLabelText('Include repaired (6)')).toBeTruthy();
    expect(readableText()).not.toMatch(SPANISH);
  });

  it('opens the directions panel and walks a route, all in English', () => {
    routeState({ status: 'success', route: routeFixture });
    renderInEnglish(<MapScreen data={data} />);
    fireEvent.click(screen.getByRole('button', { name: 'Directions' }));
    fireEvent.click(screen.getByRole('button', { name: 'tap 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'tap 2' }));

    expect(screen.getByRole('region', { name: 'Directions' })).toBeTruthy();
    expect(screen.getByText('Route ready.')).toBeTruthy();
    expect(screen.getByText('Walk through the route')).toBeTruthy();
    expect(readableText()).not.toMatch(SPANISH);
  });
});
