import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import type { RouteState } from '../hooks/useRoute';
import { groupRouteSteps } from '../lib/route-groups';
import { routeFixture } from '../test/route-fixtures';
import type { LatLng } from '../types/route';
import { renderInEnglish } from '../test/english';
import { RoutePanel } from './RoutePanel';

const A: LatLng = { latitude: 1.2136, longitude: -77.2811 };
const B: LatLng = { latitude: 1.215, longitude: -77.279 };

function renderPanel(
  overrides: Partial<Parameters<typeof RoutePanel>[0]> = {},
  state: RouteState = { status: 'idle' },
) {
  const handlers = {
    onCriterionChange: vi.fn(),
    onRetry: vi.fn(),
    onSwap: vi.fn(),
    onClear: vi.fn(),
    onClose: vi.fn(),
  };
  render(
    <RoutePanel
      origin={null}
      destination={null}
      criterion="balanced"
      state={state}
      wakeUrl="https://ai.example.com/health"
      {...handlers}
      {...overrides}
    />,
  );
  return handlers;
}

const httpError = (status: number, code: string, details?: Record<string, unknown>) =>
  new ApiError('http', `${code} ${status}`, status, code, details);

afterEach(() => {
  vi.useRealTimers();
});

describe('RoutePanel', () => {
  it.each([
    [null, null, 'Toca el mapa para poner el origen (A).'],
    [A, null, 'Ahora toca el mapa para poner el destino (B).'],
    [A, B, 'Arrastra A o B para moverlos, o toca el mapa para empezar otra ruta.'],
  ])('tells what to do next (%#)', (origin, destination, text) => {
    renderPanel({ origin, destination });
    expect(screen.getByText(text)).toBeTruthy();
  });

  it('shows where A and B were placed, and which one is still missing', () => {
    renderPanel({ origin: A, destination: null });

    const points = screen.getByRole('list', { name: 'Puntos de la ruta' });
    const items = [...points.querySelectorAll('li')].map((item) => item.textContent);
    expect(items).toEqual(['AOrigen1,21360 · -77,28110', 'BDestinoSin poner']);
  });

  it('shows the three criteria with the chosen one pressed', () => {
    renderPanel({ criterion: 'avoid_potholes' });

    expect(screen.getByRole('button', { name: 'Evitar baches' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(screen.getByRole('button', { name: 'Más corta' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
    expect(
      screen.getByText('Evita las calles con baches, aunque el camino sea más largo.'),
    ).toBeTruthy();
  });

  it('changes the criterion', () => {
    const { onCriterionChange } = renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Más corta' }));
    expect(onCriterionChange).toHaveBeenCalledWith('shortest');
  });

  it('says the route is being computed', () => {
    renderPanel({ origin: A, destination: B }, { status: 'loading' });
    expect(screen.getByRole('status').textContent).toBe('Calculando la ruta…');
  });

  it('explains that the route service is waking up and which attempt it is', () => {
    renderPanel({ origin: A, destination: B }, { status: 'waking', attempt: 2, retryAfterS: 30 });
    expect(screen.getByText('Despertando el servicio de rutas…')).toBeTruthy();
    expect(screen.getByText(/Intento 2 de 4/)).toBeTruthy();
  });

  it('says the route is ready, with its numbers in the summary', () => {
    renderPanel(
      { origin: A, destination: B, groups: groupRouteSteps(routeFixture) },
      { status: 'success', route: routeFixture },
    );

    expect(screen.getByRole('status').textContent).toBe('Ruta lista.');
    expect(screen.getByText('336 m')).toBeTruthy();
    expect(screen.getByText('Calles').nextElementSibling?.textContent).toBe('2');
    expect(screen.getByText('Tramos').nextElementSibling?.textContent).toBe('3');
    expect(screen.getByText('Con daño').nextElementSibling?.textContent).toBe('1 de 3');
  });

  it('says when the route came from the cache', () => {
    renderPanel(
      { origin: A, destination: B },
      { status: 'success', route: { ...routeFixture, fromCache: true } },
    );
    expect(screen.getByText('Salió de la caché.', { exact: false })).toBeTruthy();
  });

  it('explains an error and retries from its button', () => {
    const { onRetry } = renderPanel(
      { origin: A, destination: B },
      { status: 'error', error: new ApiError('timeout', 'x') },
    );

    expect(screen.getByRole('alert').textContent).toContain('El servidor no respondió a tiempo');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('explains a point too far from the streets, without a button that cannot help', () => {
    renderPanel(
      { origin: A, destination: B },
      {
        status: 'error',
        error: httpError(422, 'OUTSIDE_NETWORK', {
          point: 'origin',
          distanceM: 450,
          maxDistanceM: 200,
        }),
      },
    );

    expect(screen.getByRole('alert').textContent).toContain('El origen quedó lejos de las calles');
    expect(screen.queryByRole('button', { name: /Reintentar/ })).toBeNull();
  });

  it.each([[httpError(404, 'NO_ROUTE')], [httpError(400, 'INVALID_REQUEST')]])(
    'offers no Retry when asking again cannot change the answer (%#)',
    (error) => {
      renderPanel({ origin: A, destination: B }, { status: 'error', error });
      expect(screen.queryByRole('button', { name: /Reintentar/ })).toBeNull();
    },
  );

  it('keeps "Reintentar" waiting the seconds the server asked for', () => {
    vi.useFakeTimers();
    renderPanel(
      { origin: A, destination: B },
      { status: 'error', error: httpError(429, 'TOO_MANY_REQUESTS', { retryAfterS: 3 }) },
    );

    const button = screen.getByRole('button', { name: 'Reintentar en 3 s' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    act(() => vi.advanceTimersByTime(3000));

    expect((screen.getByRole('button', { name: 'Reintentar' }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it('starts the countdown again when the same error comes back on a new request', () => {
    vi.useFakeTimers();
    const tooMany = {
      status: 'error' as const,
      error: httpError(429, 'TOO_MANY_REQUESTS', { retryAfterS: 3 }),
    };
    const props = {
      origin: A,
      destination: B,
      criterion: 'balanced' as const,
      wakeUrl: null,
      onCriterionChange: vi.fn(),
      onRetry: vi.fn(),
      onSwap: vi.fn(),
      onClear: vi.fn(),
      onClose: vi.fn(),
    };
    const { rerender } = render(<RoutePanel {...props} state={tooMany} requestKey="1" />);
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy();

    rerender(<RoutePanel {...props} state={{ ...tooMany }} requestKey="2" />);

    expect(screen.getByRole('button', { name: 'Reintentar en 3 s' })).toBeTruthy();
  });

  it('offers the link that wakes the route service when it did not wake in time', () => {
    renderPanel(
      { origin: A, destination: B },
      {
        status: 'error',
        error: httpError(503, 'ROUTE_SERVICE_UNAVAILABLE', { retryable: true, retryAfterS: 30 }),
      },
    );

    const link = screen.getByRole('link', { name: 'Despertar el servicio de rutas' });
    expect(link.getAttribute('href')).toBe('https://ai.example.com/health');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('offers no link when the address is not configured', () => {
    renderPanel(
      { origin: A, destination: B, wakeUrl: null },
      {
        status: 'error',
        error: httpError(503, 'ROUTE_SERVICE_UNAVAILABLE', { retryable: true, retryAfterS: 30 }),
      },
    );
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('swaps and clears only when there is something to swap or clear', () => {
    renderPanel({ origin: A, destination: null });

    expect(
      (screen.getByRole('button', { name: 'Intercambiar A y B' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect((screen.getByRole('button', { name: 'Limpiar' }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it('swaps, clears and closes', () => {
    const { onSwap, onClear, onClose } = renderPanel({ origin: A, destination: B });

    fireEvent.click(screen.getByRole('button', { name: 'Intercambiar A y B' }));
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar Cómo llegar' }));

    expect(onSwap).toHaveBeenCalledOnce();
    expect(onClear).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows the street list and the technical details when the route arrives', () => {
    renderPanel(
      { origin: A, destination: B, groups: groupRouteSteps(routeFixture), selected: null },
      { status: 'success', route: routeFixture },
    );

    expect(screen.getByRole('region', { name: 'Recorrido de la ruta' })).toBeTruthy();
    expect(screen.getByText('Detalles técnicos')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Calle 18/ })).toBeTruthy();
  });

  it('shows no summary or list before the route arrives', () => {
    renderPanel({ origin: A, destination: B }, { status: 'loading' });
    expect(screen.queryByText('Detalles técnicos')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Recorrido de la ruta' })).toBeNull();
  });

  it('passes the street picked in the list on', () => {
    const onSelect = vi.fn();
    renderPanel(
      {
        origin: A,
        destination: B,
        groups: groupRouteSteps(routeFixture),
        selected: null,
        onSelect,
      },
      { status: 'success', route: routeFixture },
    );

    fireEvent.click(screen.getByRole('button', { name: /Calle sin nombre/ }));

    expect(onSelect).toHaveBeenCalledWith(1);
  });
});

describe('RoutePanel in English', () => {
  function renderEnglish(
    overrides: Partial<Parameters<typeof RoutePanel>[0]> = {},
    state: RouteState = { status: 'idle' },
  ) {
    renderInEnglish(
      <RoutePanel
        origin={null}
        destination={null}
        criterion="balanced"
        state={state}
        wakeUrl="https://ai.example.com/health"
        onCriterionChange={vi.fn()}
        onRetry={vi.fn()}
        onSwap={vi.fn()}
        onClear={vi.fn()}
        onClose={vi.fn()}
        {...overrides}
      />,
    );
  }

  it('tells what to do next, step by step, in English', () => {
    renderEnglish();
    expect(screen.getByRole('region', { name: 'Directions' })).toBeTruthy();
    expect(screen.getByText('Tap the map to place the origin (A).')).toBeTruthy();
    expect(
      screen.getByText('Not set', { selector: '.route-points__item:first-child *' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Close Directions' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Swap A and B' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeTruthy();
  });

  it('writes the points with English decimals and the hint for the destination', () => {
    renderEnglish({ origin: A });
    expect(screen.getByText('Now tap the map to place the destination (B).')).toBeTruthy();
    expect(screen.getByText('1.21360 · -77.28110')).toBeTruthy();
  });

  it('lets the person choose the criterion, in English', () => {
    renderEnglish({ origin: A, destination: B });
    expect(screen.getByRole('button', { name: 'Shortest' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Avoid potholes' })).toBeTruthy();
    expect(
      screen.getByText('Balances the distance and the condition of the streets.'),
    ).toBeTruthy();
  });

  it('says that the route service is waking up, and which attempt it is', () => {
    renderEnglish({ origin: A, destination: B }, { status: 'waking', attempt: 2, retryAfterS: 30 });
    expect(screen.getByText('Waking up the route service…')).toBeTruthy();
    expect(screen.getByText(/Attempt 2 of/)).toBeTruthy();
  });

  it('says that the route is ready and whether it came from the cache', () => {
    renderEnglish(
      { origin: A, destination: B, groups: groupRouteSteps(routeFixture) },
      { status: 'success', route: { ...routeFixture, fromCache: true } },
    );
    expect(screen.getByText('Route ready.')).toBeTruthy();
    expect(screen.getByText('It came from the cache.')).toBeTruthy();
  });

  it('explains an error and counts down the wait before retrying, in English', () => {
    renderEnglish(
      { origin: A, destination: B },
      { status: 'error', error: httpError(429, 'TOO_MANY_REQUESTS', { retryAfterS: 5 }) },
    );
    expect(screen.getByText('Too many routes in a row')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry in 5 s' })).toBeTruthy();
  });

  it('offers the link that wakes the route service, in English', () => {
    renderEnglish(
      { origin: A, destination: B },
      {
        status: 'error',
        error: httpError(503, 'ROUTE_SERVICE_UNAVAILABLE', { retryAfterS: 30 }),
      },
    );
    expect(screen.getByRole('link', { name: 'Wake up the route service' })).toBeTruthy();
  });
});
