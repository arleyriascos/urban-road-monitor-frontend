import { useEffect, useRef, useState } from 'react';
import { classifyGpsError, type GpsProblem } from '../sending/gps-error';
import type { GpsFix } from '../sending/geo';

export interface GeolocationDependencies {
  /** Starts following the position; gives back how to stop. Null when the browser has no GPS. */
  watch: (
    onFix: (fix: GpsFix) => void,
    onError: (error: { code?: number }) => void,
  ) => (() => void) | null;
}

const defaultDependencies: GeolocationDependencies = {
  watch(onFix, onError) {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return null;
    const id = navigator.geolocation.watchPosition(
      (position) =>
        onFix({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyM: position.coords.accuracy,
          timestamp: position.timestamp,
        }),
      onError,
      { enableHighAccuracy: true, maximumAge: 2_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  },
};

/** `waiting`: asked but no position yet. */
export type GeolocationState =
  | { status: 'off' }
  | { status: 'waiting' }
  | { status: 'ready'; fix: GpsFix }
  | { status: 'problem'; problem: GpsProblem };

export interface Geolocation {
  state: GeolocationState;
  /** The latest position, readable at any moment without waiting for a render. */
  latest: () => GpsFix | null;
}

/**
 * Follows the position of the phone while `active` is true. The browser asks for permission
 * when it starts. After a problem it keeps listening: a later fix brings the state back.
 */
export function useGeolocation(
  active: boolean,
  dependencies: GeolocationDependencies = defaultDependencies,
): Geolocation {
  const [state, setState] = useState<GeolocationState>({ status: 'off' });
  const fixRef = useRef<GpsFix | null>(null);
  const dependenciesRef = useRef(dependencies);

  useEffect(() => {
    if (!active) return;
    const fail = (problem: GpsProblem) => setState({ status: 'problem', problem });
    const stop = dependenciesRef.current.watch(
      (fix) => {
        fixRef.current = fix;
        setState({ status: 'ready', fix });
      },
      (error) => fail(classifyGpsError(error)),
    );
    if (!stop) {
      fail('unsupported');
      return;
    }
    return () => {
      stop();
      fixRef.current = null;
      setState({ status: 'off' });
    };
  }, [active]);

  // Turned on but nothing heard yet: it is waiting for the first fix.
  const shown: GeolocationState = !active
    ? { status: 'off' }
    : state.status === 'off'
      ? { status: 'waiting' }
      : state;
  return { state: shown, latest: () => fixRef.current };
}
