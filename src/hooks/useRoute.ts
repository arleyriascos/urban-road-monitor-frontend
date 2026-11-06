import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api/http';
import { wakeAiService } from '../api/ai-service';
import { getRoute, type RouteQuery } from '../api/routes';
import { retryAfterSeconds } from '../lib/route-errors';
import type { LatLng, RouteAnswer, RouteCriterion } from '../types/route';

/** While the route service wakes up, the request is tried this many times in all. */
export const MAX_WAKE_ATTEMPTS = 4;

export type RouteState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'waking'; attempt: number; retryAfterS: number }
  | { status: 'success'; route: RouteAnswer }
  | { status: 'error'; error: ApiError };

export interface RouteDependencies {
  getRoute: (query: RouteQuery, signal: AbortSignal) => Promise<RouteAnswer>;
  wakeAiService: () => boolean;
}

const defaultDependencies: RouteDependencies = { getRoute, wakeAiService };

const IDLE: RouteState = { status: 'idle' };
const LOADING: RouteState = { status: 'loading' };

function isSleepingRouteService(error: ApiError): boolean {
  return (
    error.status === 503 &&
    error.code === 'ROUTE_SERVICE_UNAVAILABLE' &&
    retryAfterSeconds(error) !== undefined
  );
}

/**
 * Asks for the route whenever both points and the criterion are set, and again each time
 * one of them changes: the previous request is cancelled, so an old answer never replaces a
 * newer one. If the route service is asleep (503 with retryAfterS), it wakes the service
 * from the browser, waits and tries again, up to MAX_WAKE_ATTEMPTS times in all.
 */
export function useRoute(
  origin: LatLng | null,
  destination: LatLng | null,
  criterion: RouteCriterion,
  dependencies: RouteDependencies = defaultDependencies,
) {
  const [retries, setRetries] = useState(0);
  // Each answer is kept with the request it belongs to, so a stale one is never shown.
  const [settled, setSettled] = useState<{ key: string; state: RouteState } | null>(null);

  const key =
    origin && destination
      ? `${origin.latitude},${origin.longitude}|${destination.latitude},${destination.longitude}|${criterion}|${retries}`
      : '';

  useEffect(() => {
    if (!origin || !destination) return;
    const controller = new AbortController();
    let timer: number | undefined;
    const settle = (state: RouteState) => {
      if (!controller.signal.aborted) setSettled({ key, state });
    };

    const attempt = (number: number) => {
      dependencies
        .getRoute({ origin, destination, criterion }, controller.signal)
        .then((route) => settle({ status: 'success', route }))
        .catch((error: unknown) => {
          if (controller.signal.aborted) return; // A newer request replaced this one.
          const apiError =
            error instanceof ApiError ? error : new ApiError('network', 'Unexpected error');
          const waitS = retryAfterSeconds(apiError);
          if (
            isSleepingRouteService(apiError) &&
            waitS !== undefined &&
            number < MAX_WAKE_ATTEMPTS
          ) {
            dependencies.wakeAiService();
            settle({ status: 'waking', attempt: number, retryAfterS: waitS });
            timer = window.setTimeout(() => {
              settle(LOADING);
              attempt(number + 1);
            }, waitS * 1000);
            return;
          }
          settle({ status: 'error', error: apiError });
        });
    };

    attempt(1);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
    // The key holds every input that matters; the points are compared by value through it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, dependencies]);

  const retry = useCallback(() => setRetries((value) => value + 1), []);

  const state: RouteState = !key ? IDLE : settled?.key === key ? settled.state : LOADING;
  /** Changes with every request (new points, criterion or retry), so the UI can reset itself. */
  return { state, retry, requestKey: key };
}
