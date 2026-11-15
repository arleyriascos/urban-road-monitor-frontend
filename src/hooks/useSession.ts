import { useCallback, useEffect, useReducer, useRef } from 'react';
import { getMe, signInWithGoogle, signOut } from '../api/auth';
import { ApiError } from '../api/http';
import { isSessionGone } from '../lib/auth-errors';
import { initialSessionState, sessionReducer, type SessionState } from '../lib/session-state';
import { sessionStore, type SessionStore } from '../lib/session-storage';

/** What the hook needs from outside, so the tests can replace it. */
export interface SessionDependencies {
  store: SessionStore;
  signInWithGoogle: typeof signInWithGoogle;
  getMe: typeof getMe;
  signOut: typeof signOut;
}

const defaultDependencies: SessionDependencies = {
  store: sessionStore,
  signInWithGoogle,
  getMe,
  signOut,
};

/** The wait before asking again when the server did not answer: 3 s, 6 s, … up to 15 s. */
export function checkRetryDelayMs(attempt: number): number {
  return Math.min(3_000 * (attempt + 1), 15_000);
}

const asApiError = (error: unknown): ApiError =>
  error instanceof ApiError ? error : new ApiError('network', 'Unexpected error');

export interface SessionControls {
  state: SessionState;
  /** Gives Google's ID token to the backend; the result shows in `state`. */
  signInWithCredential: (credential: string) => Promise<void>;
  continueAsGuest: () => void;
  /** A guest goes to the entry screen to sign in. */
  requestSignIn: () => void;
  /** While the saved session cannot be checked: ask again now. */
  retryCheck: () => void;
  /** While the saved session cannot be checked: go on as a guest, keeping the session saved. */
  skipCheck: () => void;
  signOut: () => void;
}

/**
 * The session of the person. When the page opens with a saved identifier it asks the backend
 * (GET /api/auth/me): a 401 closes the session and goes back to the entry; a timeout, a 503
 * or no connection keep the identifier and ask again, because they say nothing about it.
 */
export function useSession(
  dependencies: SessionDependencies = defaultDependencies,
): SessionControls {
  const { store, ...api } = dependencies;
  const [state, dispatch] = useReducer(sessionReducer, undefined, () =>
    initialSessionState({ token: store.readToken(), guest: store.isGuest() }),
  );

  const checkingToken = state.status === 'checking' ? state.token : null;
  const checkingAttempt = state.status === 'checking' ? state.attempt : 0;
  const unreachable = state.status === 'checking' && state.unreachable !== null;

  // Ask the backend whether the saved session still lives.
  useEffect(() => {
    if (checkingToken === null) return;
    const controller = new AbortController();
    api
      .getMe(checkingToken, controller.signal)
      .then((user) => dispatch({ type: 'check_answered', user }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const apiError = asApiError(error);
        if (isSessionGone(apiError)) {
          store.clearToken();
          dispatch({ type: 'check_session_gone' });
        } else {
          dispatch({ type: 'check_unreachable', error: apiError });
        }
      });
    return () => controller.abort();
    // `api` and `store` are the same objects for the life of the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingToken, checkingAttempt]);

  // The server did not answer: ask again after a pause that grows.
  useEffect(() => {
    if (!unreachable) return;
    const timer = window.setTimeout(
      () => dispatch({ type: 'check_retry' }),
      checkRetryDelayMs(checkingAttempt),
    );
    return () => window.clearTimeout(timer);
  }, [unreachable, checkingAttempt]);

  // The latest state for the callbacks, so they never act on an old one.
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  });

  const signInWithCredential = useCallback(
    async (credential: string) => {
      const current = latest.current;
      if (current.status !== 'entry' || current.signIn.phase === 'working') return;
      dispatch({ type: 'sign_in_started' });
      try {
        const answer = await api.signInWithGoogle(credential);
        store.saveToken(answer.token);
        store.clearGuest();
        dispatch({ type: 'signed_in', token: answer.token, user: answer.user });
      } catch (error) {
        dispatch({ type: 'sign_in_failed', error: asApiError(error) });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const continueAsGuest = useCallback(() => {
    store.saveGuest();
    store.clearToken(); // An old identifier that could not be checked is dropped on purpose.
    dispatch({ type: 'guest_chosen' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestSignIn = useCallback(() => {
    store.clearGuest();
    dispatch({ type: 'sign_in_requested' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retryCheck = useCallback(() => dispatch({ type: 'check_retry' }), []);
  const skipCheck = useCallback(() => dispatch({ type: 'check_skipped' }), []);

  const signOutNow = useCallback(() => {
    const current = latest.current;
    if (current.status !== 'signed_in') return;
    // The page forgets the session first: a failed call must not keep the person signed in.
    store.clearToken();
    store.clearGuest();
    dispatch({ type: 'signed_out' });
    api.signOut(current.token).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state,
    signInWithCredential,
    continueAsGuest,
    requestSignIn,
    retryCheck,
    skipCheck,
    signOut: signOutNow,
  };
}
