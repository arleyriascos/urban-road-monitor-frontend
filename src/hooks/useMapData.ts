import { useCallback, useEffect, useState } from 'react';
import { getNetworkStats, getPotholes, getRoadSegments } from '../api/map';
import { ApiError } from '../api/http';
import type { NetworkStats, PotholeCollection, SegmentCollection } from '../types/map';

/** After this delay the UI explains that the free server may be waking up. */
export const SLOW_REQUEST_MS = 5_000;

export interface MapData {
  segments: SegmentCollection;
  /** Includes the repaired potholes: the screen filters them. */
  potholes: PotholeCollection;
  stats: NetworkStats;
}

export type MapDataState =
  | { status: 'loading'; slow: boolean }
  | { status: 'error'; error: ApiError }
  | { status: 'success'; data: MapData; receivedAt: Date };

/** Loads everything the map needs and exposes the three states the UI must show. */
export function useMapData() {
  const [state, setState] = useState<MapDataState>({ status: 'loading', slow: false });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const slowTimer = window.setTimeout(() => {
      setState((current) => (current.status === 'loading' ? { ...current, slow: true } : current));
    }, SLOW_REQUEST_MS);

    Promise.all([
      getRoadSegments(signal),
      getPotholes({ includeRepaired: true }, signal),
      getNetworkStats(signal),
    ])
      .then(([segments, potholes, stats]) =>
        setState({
          status: 'success',
          data: { segments, potholes, stats },
          receivedAt: new Date(),
        }),
      )
      .catch((error: unknown) => {
        if (signal.aborted) return; // Component unmounted or retried.
        const apiError =
          error instanceof ApiError ? error : new ApiError('network', 'Unexpected error');
        setState({ status: 'error', error: apiError });
      })
      .finally(() => window.clearTimeout(slowTimer));

    return () => {
      controller.abort();
      window.clearTimeout(slowTimer);
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading', slow: false });
    setAttempt((value) => value + 1);
  }, []);

  return { state, retry };
}
