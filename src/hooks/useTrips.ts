import { useCallback, useEffect, useRef, useState } from 'react';
import { listTrips } from '../api/trips';
import { ApiError } from '../api/http';
import type { TripSummary } from '../types/trips';

/** How many trips come in each page. */
export const TRIPS_PAGE_SIZE = 10;

export interface TripsDependencies {
  listTrips: typeof listTrips;
}

const defaultDependencies: TripsDependencies = { listTrips };

export type TripsState =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | {
      status: 'ready';
      trips: TripSummary[];
      /** Null when these are all of them. */
      nextCursor: string | null;
      /** What the "see more" button is doing. */
      more: 'idle' | 'loading' | 'failed';
    };

const asApiError = (error: unknown): ApiError =>
  error instanceof ApiError ? error : new ApiError('network', 'Unexpected error');

/**
 * The trips of the person, newest first, a page at a time. The first page loads by itself;
 * `loadMore` adds the next one below, and `retry` asks again after a failure of the first page.
 * A trip that comes twice (a new trip pushed the pages) is shown once.
 */
export function useTrips(
  token: string,
  dependencies: TripsDependencies = defaultDependencies,
): { state: TripsState; loadMore: () => void; retry: () => void } {
  const [state, setState] = useState<TripsState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const latest = useRef(state);
  // Set at once when a page is asked, because `state` only changes after the next render.
  const fetchingMore = useRef(false);
  useEffect(() => {
    latest.current = state;
  });
  const { listTrips: list } = dependencies;

  // The first page.
  useEffect(() => {
    const controller = new AbortController();
    list(token, { limit: TRIPS_PAGE_SIZE, signal: controller.signal })
      .then((page) =>
        setState({ status: 'ready', trips: page.trips, nextCursor: page.nextCursor, more: 'idle' }),
      )
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', error: asApiError(error) });
      });
    return () => controller.abort();
  }, [token, list, attempt]);

  const loadMore = useCallback(() => {
    const current = latest.current;
    if (
      current.status !== 'ready' ||
      current.nextCursor === null ||
      current.more === 'loading' ||
      fetchingMore.current
    ) {
      return;
    }
    const cursor = current.nextCursor;
    fetchingMore.current = true;
    setState({ ...current, more: 'loading' });
    list(token, { limit: TRIPS_PAGE_SIZE, cursor })
      .finally(() => {
        fetchingMore.current = false;
      })
      .then((page) =>
        setState((now) => {
          if (now.status !== 'ready') return now;
          const known = new Set(now.trips.map((trip) => trip.id));
          return {
            status: 'ready',
            trips: [...now.trips, ...page.trips.filter((trip) => !known.has(trip.id))],
            nextCursor: page.nextCursor,
            more: 'idle',
          };
        }),
      )
      .catch(() => setState((now) => (now.status === 'ready' ? { ...now, more: 'failed' } : now)));
  }, [token, list]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((value) => value + 1);
  }, []);

  return { state, loadMore, retry };
}
