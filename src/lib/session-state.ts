import type { ApiError } from '../api/http';
import type { AuthUser } from '../types/auth';

/** What the entry screen is doing about the Google button. */
export type SignInProgress =
  { phase: 'idle' } | { phase: 'working' } | { phase: 'failed'; error: ApiError };

/**
 * Where the person is. The page never decides this from the screen: it follows these states.
 *
 * - `entry`: nobody chose yet (or they signed out, or the session was over): the entry screen.
 * - `checking`: there is a saved identifier; asking the backend if it still lives. `attempt`
 *   counts the tries (each one is a new request) and `unreachable` is the last error when the
 *   server did not answer, which says nothing about the session.
 * - `guest`: using the app without an account. `remembered` is false when the person skipped
 *   the check for now: the identifier is kept and checked again the next time.
 * - `signed_in`: with a session that the backend confirmed.
 */
export type SessionState =
  | { status: 'entry'; signIn: SignInProgress }
  | { status: 'checking'; token: string; attempt: number; unreachable: ApiError | null }
  | { status: 'guest'; remembered: boolean }
  | { status: 'signed_in'; token: string; user: AuthUser };

export type SessionAction =
  | { type: 'check_answered'; user: AuthUser }
  | { type: 'check_session_gone' }
  | { type: 'check_unreachable'; error: ApiError }
  | { type: 'check_retry' }
  | { type: 'check_skipped' }
  | { type: 'guest_chosen' }
  | { type: 'sign_in_requested' }
  | { type: 'sign_in_started' }
  | { type: 'sign_in_failed'; error: ApiError }
  | { type: 'signed_in'; token: string; user: AuthUser }
  | { type: 'signed_out' };

/** The state of the first screen, from what the browser remembered. */
export function initialSessionState(remembered: {
  token: string | null;
  guest: boolean;
}): SessionState {
  if (remembered.token) {
    return { status: 'checking', token: remembered.token, attempt: 0, unreachable: null };
  }
  if (remembered.guest) return { status: 'guest', remembered: true };
  return { status: 'entry', signIn: { phase: 'idle' } };
}

const ENTRY: SessionState = { status: 'entry', signIn: { phase: 'idle' } };

/** Pure: given the state and what happened, the next state. Anything out of place changes nothing. */
export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'check_answered':
      return state.status === 'checking'
        ? { status: 'signed_in', token: state.token, user: action.user }
        : state;
    case 'check_session_gone':
      return state.status === 'checking' ? ENTRY : state;
    case 'check_unreachable':
      return state.status === 'checking' ? { ...state, unreachable: action.error } : state;
    case 'check_retry':
      return state.status === 'checking'
        ? { ...state, attempt: state.attempt + 1, unreachable: null }
        : state;
    case 'check_skipped':
      return state.status === 'checking' ? { status: 'guest', remembered: false } : state;
    case 'guest_chosen':
      return state.status === 'entry' ? { status: 'guest', remembered: true } : state;
    case 'sign_in_requested':
      return state.status === 'guest' ? ENTRY : state;
    case 'sign_in_started':
      return state.status === 'entry' ? { status: 'entry', signIn: { phase: 'working' } } : state;
    case 'sign_in_failed':
      return state.status === 'entry' && state.signIn.phase === 'working'
        ? { status: 'entry', signIn: { phase: 'failed', error: action.error } }
        : state;
    case 'signed_in':
      return state.status === 'entry'
        ? { status: 'signed_in', token: action.token, user: action.user }
        : state;
    case 'signed_out':
      return state.status === 'signed_in' ? ENTRY : state;
  }
}
