import { useCallback, useEffect, useState } from 'react';
import { getHello, type HelloMessage } from '../api/hello';
import { ApiError } from '../api/http';

/** After this delay the UI explains that the free server may be waking up. */
const SLOW_REQUEST_MS = 5_000;

export type HelloState =
  | { status: 'loading'; slow: boolean }
  | { status: 'error'; error: ApiError }
  | { status: 'success'; data: HelloMessage; receivedAt: Date };

/** Loads GET /api/hello and exposes the three states the UI must show. */
export function useHello() {
  const [state, setState] = useState<HelloState>({ status: 'loading', slow: false });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const slowTimer = window.setTimeout(() => {
      setState((current) => (current.status === 'loading' ? { ...current, slow: true } : current));
    }, SLOW_REQUEST_MS);

    getHello(controller.signal)
      .then((data) => setState({ status: 'success', data, receivedAt: new Date() }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return; // Component unmounted or retried.
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
