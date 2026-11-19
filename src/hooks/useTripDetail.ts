import { useEffect, useState } from 'react';
import { getTrip } from '../api/trips';
import type { TripView } from '../types/trips';

export interface TripDetailDependencies {
  getTrip: typeof getTrip;
}

const defaultDependencies: TripDetailDependencies = { getTrip };

export type TripDetailState =
  { status: 'loading' } | { status: 'failed' } | { status: 'ready'; trip: TripView };

/** One trip with its detections by severity, read when it is shown. */
export function useTripDetail(
  token: string,
  tripId: string,
  dependencies: TripDetailDependencies = defaultDependencies,
): TripDetailState {
  const [state, setState] = useState<TripDetailState>({ status: 'loading' });
  const { getTrip: read } = dependencies;

  useEffect(() => {
    const controller = new AbortController();
    read(token, tripId, controller.signal)
      .then((trip) => setState({ status: 'ready', trip }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'failed' });
      });
    return () => controller.abort();
  }, [token, tripId, read]);

  return state;
}
