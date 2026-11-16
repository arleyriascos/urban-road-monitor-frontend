import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { GpsFix } from '../sending/geo';
import { useGeolocation, type GeolocationDependencies } from './useGeolocation';

const FIX: GpsFix = { latitude: 1.2, longitude: -77.3, accuracyM: 5, timestamp: 1000 };

function fakeWatch() {
  const stop = vi.fn();
  let onFix: (fix: GpsFix) => void = () => undefined;
  let onError: (error: { code?: number }) => void = () => undefined;
  const dependencies: GeolocationDependencies = {
    watch: vi.fn((fix, error) => {
      onFix = fix;
      onError = error;
      return stop;
    }),
  };
  return {
    dependencies,
    stop,
    fix: (value: GpsFix) => onFix(value),
    fail: (code: number) => onError({ code }),
  };
}

describe('useGeolocation', () => {
  it('does not ask for the position while it is not active', () => {
    const geo = fakeWatch();
    const { result } = renderHook(() => useGeolocation(false, geo.dependencies));
    expect(result.current.state).toEqual({ status: 'off' });
    expect(geo.dependencies.watch).not.toHaveBeenCalled();
  });

  it('waits for the first fix and then shows the latest one', () => {
    const geo = fakeWatch();
    const { result } = renderHook(() => useGeolocation(true, geo.dependencies));
    expect(result.current.state).toEqual({ status: 'waiting' });
    expect(result.current.latest()).toBeNull();

    act(() => geo.fix(FIX));
    expect(result.current.state).toEqual({ status: 'ready', fix: FIX });
    expect(result.current.latest()).toEqual(FIX);

    const next = { ...FIX, latitude: 1.3 };
    act(() => geo.fix(next));
    expect(result.current.latest()).toEqual(next);
  });

  it('tells a refused permission apart from a position that cannot be found', () => {
    const geo = fakeWatch();
    const { result } = renderHook(() => useGeolocation(true, geo.dependencies));
    act(() => geo.fail(1));
    expect(result.current.state).toEqual({ status: 'problem', problem: 'denied' });
    act(() => geo.fail(2));
    expect(result.current.state).toEqual({ status: 'problem', problem: 'unavailable' });
  });

  it('recovers when a fix comes after a problem', () => {
    const geo = fakeWatch();
    const { result } = renderHook(() => useGeolocation(true, geo.dependencies));
    act(() => geo.fail(2));
    act(() => geo.fix(FIX));
    expect(result.current.state.status).toBe('ready');
  });

  it('says so when the browser has no GPS', () => {
    const dependencies: GeolocationDependencies = { watch: () => null };
    const { result } = renderHook(() => useGeolocation(true, dependencies));
    expect(result.current.state).toEqual({ status: 'problem', problem: 'unsupported' });
  });

  it('stops following and forgets the position when it is turned off', () => {
    const geo = fakeWatch();
    const { result, rerender } = renderHook(
      ({ active }) => useGeolocation(active, geo.dependencies),
      {
        initialProps: { active: true },
      },
    );
    act(() => geo.fix(FIX));
    rerender({ active: false });
    expect(geo.stop).toHaveBeenCalledTimes(1);
    expect(result.current.state).toEqual({ status: 'off' });
    expect(result.current.latest()).toBeNull();
  });

  it('stops following when the screen goes away', () => {
    const geo = fakeWatch();
    const { unmount } = renderHook(() => useGeolocation(true, geo.dependencies));
    unmount();
    expect(geo.stop).toHaveBeenCalledTimes(1);
  });
});
