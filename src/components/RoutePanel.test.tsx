import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import type { RouteState } from '../hooks/useRoute';
import { routeFixture } from '../test/route-fixtures';
import type { LatLng } from '../types/route';
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

  it('sums up the route when it arrives', () => {
    renderPanel({ origin: A, destination: B }, { status: 'success', route: routeFixture });
    expect(screen.getByRole('status').textContent).toBe('Ruta lista: 336 m en 3 tramos.');
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
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

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
});
