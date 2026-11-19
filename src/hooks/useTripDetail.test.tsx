import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TripView } from '../types/trips';
import { useTripDetail } from './useTripDetail';

const TOKEN = 't'.repeat(43);
const TRIP: TripView = {
  id: 'trip-1',
  startedAt: '2026-11-16T13:30:00.000Z',
  endedAt: null,
  framesAnalyzed: 10,
  distanceM: 100,
  detections: {
    total: 1,
    bySeverity: [
      { severity: 'leve', count: 1 },
      { severity: 'moderado', count: 0 },
      { severity: 'grave', count: 0 },
    ],
  },
};

describe('useTripDetail', () => {
  it('reads the trip with the session and gives it when it arrives', async () => {
    const read = vi.fn(async () => TRIP);
    const { result } = renderHook(() => useTripDetail(TOKEN, 'trip-1', { getTrip: read }));

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', trip: TRIP }));
    expect(read).toHaveBeenCalledExactlyOnceWith(TOKEN, 'trip-1', expect.any(AbortSignal));
  });

  it('says it failed when the server does not give the trip', async () => {
    const read = vi.fn(async () => {
      throw new Error('404');
    });
    const { result } = renderHook(() => useTripDetail(TOKEN, 'x', { getTrip: read }));

    await waitFor(() => expect(result.current.status).toBe('failed'));
  });

  it('cancels the request when the details close before it arrives', () => {
    let signal: AbortSignal | undefined;
    const read = vi.fn((_token: string, _id: string, given?: AbortSignal) => {
      signal = given;
      return new Promise<TripView>(() => undefined);
    });
    const { unmount } = renderHook(() => useTripDetail(TOKEN, 'x', { getTrip: read }));

    unmount();

    expect(signal?.aborted).toBe(true);
  });
});
