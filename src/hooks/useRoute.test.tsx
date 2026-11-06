import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import type { RouteQuery } from '../api/routes';
import { routeFixture } from '../test/route-fixtures';
import type { LatLng, RouteAnswer, RouteCriterion } from '../types/route';
import { MAX_WAKE_ATTEMPTS, useRoute, type RouteDependencies } from './useRoute';

const A: LatLng = { latitude: 1.2136, longitude: -77.2811 };
const B: LatLng = { latitude: 1.215, longitude: -77.279 };
const sleeping = () =>
  new ApiError('http', 'waking', 503, 'ROUTE_SERVICE_UNAVAILABLE', {
    retryable: true,
    retryAfterS: 30,
  });

type Reply = RouteAnswer | Error | 'never';

function makeDependencies(...replies: Reply[]) {
  const signals: AbortSignal[] = [];
  const getRoute = vi.fn((_query: RouteQuery, signal: AbortSignal) => {
    signals.push(signal);
    const reply = replies.shift() ?? 'never';
    if (reply === 'never') return new Promise<RouteAnswer>(() => {});
    return reply instanceof Error ? Promise.reject(reply) : Promise.resolve(reply);
  });
  const dependencies: RouteDependencies = { getRoute, wakeAiService: vi.fn(() => true) };
  return { dependencies, getRoute, signals };
}

function renderRoute(
  dependencies: RouteDependencies,
  initial: { origin: LatLng | null; destination: LatLng | null; criterion: RouteCriterion },
) {
  return renderHook(
    (props) => useRoute(props.origin, props.destination, props.criterion, dependencies),
    {
      initialProps: initial,
    },
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe('useRoute', () => {
  it('waits for both points before asking', () => {
    const { dependencies, getRoute } = makeDependencies();
    const { result } = renderRoute(dependencies, {
      origin: A,
      destination: null,
      criterion: 'balanced',
    });

    expect(result.current.state).toEqual({ status: 'idle' });
    expect(getRoute).not.toHaveBeenCalled();
  });

  it('asks for the route and shows it', async () => {
    const { dependencies, getRoute } = makeDependencies(routeFixture);
    const { result } = renderRoute(dependencies, {
      origin: A,
      destination: B,
      criterion: 'shortest',
    });

    expect(result.current.state).toEqual({ status: 'loading' });
    await waitFor(() => expect(result.current.state.status).toBe('success'));
    expect(getRoute.mock.calls[0][0]).toEqual({ origin: A, destination: B, criterion: 'shortest' });
  });

  it('cancels the previous request and never shows its late answer', async () => {
    let answerFirst: (route: RouteAnswer) => void = () => {};
    const second = { ...routeFixture, criterion: 'avoid_potholes' as const };
    const getRoute = vi
      .fn<RouteDependencies['getRoute']>()
      .mockImplementationOnce(() => new Promise((resolve) => (answerFirst = resolve)))
      .mockImplementationOnce(() => Promise.resolve(second));
    const dependencies: RouteDependencies = { getRoute, wakeAiService: vi.fn(() => true) };
    const { result, rerender } = renderRoute(dependencies, {
      origin: A,
      destination: B,
      criterion: 'balanced',
    });

    rerender({ origin: A, destination: B, criterion: 'avoid_potholes' });
    await waitFor(() => expect(result.current.state.status).toBe('success'));
    act(() => answerFirst(routeFixture));

    expect(getRoute.mock.calls[0][1].aborted).toBe(true);
    const state = result.current.state;
    expect(state.status === 'success' && state.route.criterion).toBe('avoid_potholes');
  });

  it('shows the error of the backend', async () => {
    const { dependencies } = makeDependencies(new ApiError('http', 'x', 404, 'NO_ROUTE'));
    const { result } = renderRoute(dependencies, {
      origin: A,
      destination: B,
      criterion: 'balanced',
    });

    await waitFor(() => expect(result.current.state.status).toBe('error'));
    const state = result.current.state;
    expect(state.status === 'error' && state.error.code).toBe('NO_ROUTE');
  });

  it('turns an unexpected failure into a network error', async () => {
    const { dependencies } = makeDependencies(new TypeError('boom'));
    const { result } = renderRoute(dependencies, {
      origin: A,
      destination: B,
      criterion: 'balanced',
    });

    await waitFor(() => expect(result.current.state.status).toBe('error'));
    const state = result.current.state;
    expect(state.status === 'error' && state.error.kind).toBe('network');
  });

  it('wakes the sleeping route service, waits and tries again', async () => {
    vi.useFakeTimers();
    const { dependencies, getRoute } = makeDependencies(sleeping(), routeFixture);
    const { result } = renderRoute(dependencies, {
      origin: A,
      destination: B,
      criterion: 'balanced',
    });

    await act(async () => {});
    expect(result.current.state).toEqual({ status: 'waking', attempt: 1, retryAfterS: 30 });
    expect(dependencies.wakeAiService).toHaveBeenCalledOnce();

    await act(async () => vi.advanceTimersByTimeAsync(29_999));
    expect(getRoute).toHaveBeenCalledOnce();
    await act(async () => vi.advanceTimersByTimeAsync(1));

    expect(getRoute).toHaveBeenCalledTimes(2);
    expect(result.current.state.status).toBe('success');
  });

  it(`gives up after ${MAX_WAKE_ATTEMPTS} attempts in all`, async () => {
    vi.useFakeTimers();
    const { dependencies, getRoute } = makeDependencies(
      ...Array.from({ length: MAX_WAKE_ATTEMPTS }, sleeping),
    );
    const { result } = renderRoute(dependencies, {
      origin: A,
      destination: B,
      criterion: 'balanced',
    });

    await act(async () => vi.advanceTimersByTimeAsync(5 * 30_000));

    expect(getRoute).toHaveBeenCalledTimes(MAX_WAKE_ATTEMPTS);
    const state = result.current.state;
    expect(state.status === 'error' && state.error.code).toBe('ROUTE_SERVICE_UNAVAILABLE');
  });

  it('cancels a pending retry when a point moves', async () => {
    vi.useFakeTimers();
    const { dependencies, getRoute } = makeDependencies(sleeping(), routeFixture);
    const { result, rerender } = renderRoute(dependencies, {
      origin: A,
      destination: B,
      criterion: 'balanced',
    });
    await act(async () => {});

    rerender({
      origin: A,
      destination: { latitude: 1.216, longitude: -77.278 },
      criterion: 'balanced',
    });
    await act(async () => vi.advanceTimersByTimeAsync(60_000));

    expect(getRoute).toHaveBeenCalledTimes(2);
    expect(result.current.state.status).toBe('success');
  });

  it('gives each request its own key', async () => {
    const { dependencies } = makeDependencies(routeFixture, routeFixture);
    const { result, rerender } = renderRoute(dependencies, {
      origin: A,
      destination: B,
      criterion: 'balanced',
    });
    const first = result.current.requestKey;

    rerender({ origin: A, destination: B, criterion: 'shortest' });
    const second = result.current.requestKey;
    act(() => result.current.retry());

    expect(new Set([first, second, result.current.requestKey]).size).toBe(3);
  });

  it('asks again when the person retries', async () => {
    const { dependencies, getRoute } = makeDependencies(new ApiError('network', 'x'), routeFixture);
    const { result } = renderRoute(dependencies, {
      origin: A,
      destination: B,
      criterion: 'balanced',
    });
    await waitFor(() => expect(result.current.state.status).toBe('error'));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.state.status).toBe('success'));
    expect(getRoute).toHaveBeenCalledTimes(2);
  });
});
