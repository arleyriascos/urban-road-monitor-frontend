import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import type { TripPage, TripSummary } from '../types/trips';
import { TRIPS_PAGE_SIZE, useTrips, type TripsDependencies } from './useTrips';

const TOKEN = 't'.repeat(43);

const trip = (id: string): TripSummary => ({
  id,
  startedAt: '2026-11-16T13:30:00.000Z',
  endedAt: '2026-11-16T14:05:00.000Z',
  framesAnalyzed: 100,
  distanceM: 500,
  detectionCount: 2,
  platform: 'android',
  deviceLabel: null,
  modelVersion: '1.0.0',
});

const page = (ids: string[], nextCursor: string | null): TripPage => ({
  trips: ids.map(trip),
  nextCursor,
});

function setup(...answers: (TripPage | Error)[]) {
  const list = vi.fn<TripsDependencies['listTrips']>(async () => {
    const next = answers.shift();
    if (next === undefined) throw new Error('no more answers');
    if (next instanceof Error) throw next;
    return next;
  });
  const hook = renderHook(() => useTrips(TOKEN, { listTrips: list }));
  return { list, ...hook };
}

describe('useTrips', () => {
  it('loads the first page by itself, with the session and the size of a page', async () => {
    const { result, list } = setup(page(['a', 'b'], 'next'));

    expect(result.current.state.status).toBe('loading');
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    expect(list).toHaveBeenCalledExactlyOnceWith(
      TOKEN,
      expect.objectContaining({ limit: TRIPS_PAGE_SIZE }),
    );
    expect(result.current.state).toMatchObject({ nextCursor: 'next', more: 'idle' });
    expect(result.current.state.status === 'ready' && result.current.state.trips).toHaveLength(2);
  });

  it('adds the next page below with the cursor of the first', async () => {
    const { result, list } = setup(page(['a', 'b'], 'next'), page(['c'], null));
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    act(() => result.current.loadMore());
    expect(result.current.state).toMatchObject({ more: 'loading' });
    await waitFor(() => expect(result.current.state).toMatchObject({ more: 'idle' }));

    expect(list).toHaveBeenLastCalledWith(
      TOKEN,
      expect.objectContaining({ cursor: 'next', limit: TRIPS_PAGE_SIZE }),
    );
    const state = result.current.state;
    expect(state.status === 'ready' && state.trips.map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(state).toMatchObject({ nextCursor: null });
  });

  it('shows a trip once when it comes in two pages', async () => {
    const { result } = setup(page(['a', 'b'], 'next'), page(['b', 'c'], null));
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.state).toMatchObject({ more: 'idle' }));

    const state = result.current.state;
    expect(state.status === 'ready' && state.trips.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('does nothing to load more on the last page or while it already loads', async () => {
    const { result, list } = setup(page(['a'], null));
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    act(() => result.current.loadMore());

    expect(list).toHaveBeenCalledOnce();
  });

  it('does not ask twice for the same page when the button is pressed twice', async () => {
    const { result, list } = setup(page(['a'], 'next'), page(['b'], null));
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    act(() => {
      result.current.loadMore();
      result.current.loadMore();
    });
    await waitFor(() => expect(result.current.state).toMatchObject({ more: 'idle' }));

    expect(list).toHaveBeenCalledTimes(2);
  });

  it('keeps the trips it has when the next page fails, and can ask again', async () => {
    const { result } = setup(page(['a'], 'next'), new ApiError('network', 'x'), page(['b'], null));
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.state).toMatchObject({ more: 'failed' }));
    expect(result.current.state.status === 'ready' && result.current.state.trips).toHaveLength(1);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.state).toMatchObject({ more: 'idle' }));
    expect(result.current.state.status === 'ready' && result.current.state.trips).toHaveLength(2);
  });

  it('shows the error of the first page and tries again with retry', async () => {
    const { result, list } = setup(new ApiError('timeout', 'slow'), page(['a'], null));
    await waitFor(() => expect(result.current.state.status).toBe('error'));
    expect(result.current.state).toMatchObject({ error: { kind: 'timeout' } });

    act(() => result.current.retry());
    expect(result.current.state.status).toBe('loading');
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('takes an error that is not from the server as a connection problem', async () => {
    const { result } = setup(new Error('boom'));
    await waitFor(() => expect(result.current.state.status).toBe('error'));
    expect(result.current.state).toMatchObject({ error: { kind: 'network' } });
  });
});
