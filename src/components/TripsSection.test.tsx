import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import type { TripPage, TripSummary } from '../types/trips';
import type { TripsDependencies } from '../hooks/useTrips';
import { TripsSection } from './TripsSection';

const TOKEN = 't'.repeat(43);

const trip = (id: string, startedAt: string): TripSummary => ({
  id,
  startedAt,
  endedAt: null,
  framesAnalyzed: 0,
  distanceM: 0,
  detectionCount: 0,
  platform: 'android',
  deviceLabel: null,
  modelVersion: '1.0.0',
});

const page = (trips: TripSummary[], nextCursor: string | null): TripPage => ({ trips, nextCursor });

function setup(...answers: (TripPage | Error)[]) {
  const listTrips = vi.fn<TripsDependencies['listTrips']>(async () => {
    const next = answers.shift();
    if (next === undefined) throw new Error('no more answers');
    if (next instanceof Error) throw next;
    return next;
  });
  render(<TripsSection token={TOKEN} dependencies={{ trips: { listTrips } }} />);
  return listTrips;
}

beforeEach(() => window.localStorage.clear());

describe('TripsSection', () => {
  it('says it is loading, then shows the trips newest first as the server gives them', async () => {
    setup(
      page([trip('b', '2026-11-17T13:00:00.000Z'), trip('a', '2026-11-16T13:00:00.000Z')], null),
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Mis viajes' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Cargando tus viajes…');

    const list = await screen.findByRole('list', {
      name: 'Tus viajes, del más reciente al más antiguo',
    });
    expect(list.querySelectorAll(':scope > li')).toHaveLength(2);
    expect(list.querySelectorAll('li h2')[0]!.textContent).toContain('17/11/2026');
    expect(screen.queryByRole('button', { name: 'Ver más viajes' })).toBeNull();
  });

  it('explains there are no trips and links the camera', async () => {
    setup(page([], null));

    expect(await screen.findByText('Todavía no tienes viajes')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Abrir el detector de baches' }).getAttribute('href'),
    ).toBe('/camara');
  });

  it('says it could not load and tries again', async () => {
    const listTrips = setup(new ApiError('timeout', 'slow'), page([], null));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'No pudimos cargar tus viajes',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));

    expect(await screen.findByText('Todavía no tienes viajes')).toBeTruthy();
    expect(listTrips).toHaveBeenCalledTimes(2);
  });

  it('adds the next page with "Ver más viajes", which goes away on the last page', async () => {
    const listTrips = setup(
      page([trip('b', '2026-11-17T13:00:00.000Z')], 'cursor-1'),
      page([trip('a', '2026-11-16T13:00:00.000Z')], null),
    );
    await screen.findByRole('list', { name: /Tus viajes/ });

    fireEvent.click(screen.getByRole('button', { name: 'Ver más viajes' }));

    await waitFor(() => expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2));
    expect(listTrips).toHaveBeenLastCalledWith(
      TOKEN,
      expect.objectContaining({ cursor: 'cursor-1' }),
    );
    expect(screen.queryByRole('button', { name: 'Ver más viajes' })).toBeNull();
  });

  it('keeps the trips and warns when the next page fails', async () => {
    setup(page([trip('b', '2026-11-17T13:00:00.000Z')], 'cursor-1'), new ApiError('network', 'x'));
    await screen.findByRole('list', { name: /Tus viajes/ });

    fireEvent.click(screen.getByRole('button', { name: 'Ver más viajes' }));

    expect((await screen.findByRole('alert')).textContent).toBe('No pudimos cargar más viajes.');
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Ver más viajes' })).toBeTruthy();
  });
});
