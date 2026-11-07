import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import { groupRouteSteps } from '../lib/route-groups';
import { routeFixture } from '../test/route-fixtures';
import type { RouteAnswer } from '../types/route';
import { RouteDetails } from './RouteDetails';

const origin = { latitude: 1.2136, longitude: -77.2811 };
const destination = { latitude: 1.215, longitude: -77.279 };
const groups = groupRouteSteps(routeFixture);

const dijkstra: RouteAnswer = {
  ...routeFixture,
  algorithm: 'dijkstra',
  summary: { ...routeFixture.summary, exploredNodes: 40, computationMs: 2 },
};

function renderDetails(
  fetchRoute = vi.fn(async () => dijkstra),
  route: RouteAnswer = routeFixture,
) {
  const ui = (current: RouteAnswer) => (
    <RouteDetails
      route={current}
      groups={groups}
      origin={origin}
      destination={destination}
      criterion="avoid_potholes"
      fetchRoute={fetchRoute}
    />
  );
  const view = render(ui(route));
  return { fetchRoute, rerender: (next: RouteAnswer) => view.rerender(ui(next)) };
}

const value = (label: string) => screen.getByText(label).nextElementSibling?.textContent;

describe('RouteDetails summary', () => {
  it('shows the distance, the streets, the segments and the damaged ones', () => {
    renderDetails();

    expect(value('Distancia')).toBe('336 m');
    expect(value('Calles')).toBe('2');
    expect(value('Tramos')).toBe('3');
    expect(value('Con daño')).toBe('1 de 3');
  });

  it('shows the technical details', () => {
    renderDetails();

    expect(value('Criterio')).toBe('Evitar baches');
    expect(value('Algoritmo')).toBe('A*');
    expect(value('Nodos explorados')).toBe('17');
    expect(value('Tiempo de cálculo')).toBe('0 ms');
    expect(value('Costo de la ruta')).toBe('448,7');
    expect(value('Salió de la caché')).toBe('No');
  });

  it('says when the route came from the cache', () => {
    renderDetails(undefined, { ...routeFixture, fromCache: true });
    expect(value('Salió de la caché')).toBe('Sí');
  });
});

describe('RouteDetails algorithm comparison', () => {
  it('asks for the same route with Dijkstra, and does so only when the button is pressed', () => {
    const { fetchRoute } = renderDetails();
    expect(fetchRoute).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Comparar con Dijkstra' }));

    expect(fetchRoute).toHaveBeenCalledWith({
      origin,
      destination,
      criterion: 'avoid_potholes',
      algorithm: 'dijkstra',
    });
  });

  it('asks for A* when the route was computed with Dijkstra', () => {
    const { fetchRoute } = renderDetails(
      vi.fn(async () => routeFixture),
      dijkstra,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Comparar con A*' }));

    expect(fetchRoute).toHaveBeenCalledWith(expect.objectContaining({ algorithm: 'astar' }));
  });

  it('says it is computing while it waits', () => {
    renderDetails(vi.fn(() => new Promise<RouteAnswer>(() => {})));

    fireEvent.click(screen.getByRole('button', { name: 'Comparar con Dijkstra' }));

    expect(screen.getByRole('status').textContent).toBe('Calculando con Dijkstra…');
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('puts A* and Dijkstra side by side', async () => {
    renderDetails();

    fireEvent.click(screen.getByRole('button', { name: 'Comparar con Dijkstra' }));

    const table = await screen.findByRole('table');
    const rows = Array.from(table.querySelectorAll('tbody tr')).map((row) =>
      Array.from(row.children).map((cell) => cell.textContent),
    );
    expect(rows).toEqual([
      ['A*', '17', '0 ms', '448,7'],
      ['Dijkstra', '40', '2 ms', '448,7'],
    ]);
  });

  it('says the two give the same cost and how much of Dijkstra A* explored', async () => {
    renderDetails();

    fireEvent.click(screen.getByRole('button', { name: 'Comparar con Dijkstra' }));

    expect(await screen.findByText(/mismo costo/)).toBeTruthy();
    expect(
      screen.getByText(/A\* exploró el 42,5 % de los nodos que exploró Dijkstra/),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Comparar de nuevo' })).toBeTruthy();
  });

  it('warns when the costs do not match', async () => {
    renderDetails(
      vi.fn(async () => ({ ...dijkstra, summary: { ...dijkstra.summary, cost: 500 } })),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Comparar con Dijkstra' }));

    expect(await screen.findByText(/Los costos no coinciden/)).toBeTruthy();
  });

  it('explains a failed comparison', async () => {
    renderDetails(
      vi.fn(async () => {
        throw new ApiError('http', 'x', 429, 'TOO_MANY_REQUESTS', { retryAfterS: 20 });
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Comparar con Dijkstra' }));

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe('Demasiadas rutas seguidas'),
    );
  });

  it('starts without a comparison when a new route arrives', async () => {
    const { rerender } = renderDetails();
    fireEvent.click(screen.getByRole('button', { name: 'Comparar con Dijkstra' }));
    await screen.findByRole('table');

    rerender({ ...routeFixture });

    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('button', { name: 'Comparar con Dijkstra' })).toBeTruthy();
  });
});
