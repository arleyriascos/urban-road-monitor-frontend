import type { AccountProfile, GoogleLoginAnswer } from '../types/auth';
import { getJson, postEmpty, postJson } from './http';

/** Gives Google's ID token to the backend and receives a session of its own. */
export function signInWithGoogle(
  credential: string,
  signal?: AbortSignal,
): Promise<GoogleLoginAnswer> {
  return postJson<GoogleLoginAnswer>('/api/auth/google', { credential }, { signal });
}

/**
 * Who the session belongs to. A 401 means the session no longer lives; a timeout or a 503
 * means the server could not answer, which says nothing about the session.
 */
export async function getMe(token: string, signal?: AbortSignal): Promise<AccountProfile> {
  const answer = await getJson<{ user: AccountProfile }>('/api/auth/me', { token, signal });
  return answer.user;
}

/** Closes this session (and only this one) in the backend. */
export function signOut(token: string, signal?: AbortSignal): Promise<void> {
  return postEmpty('/api/auth/logout', { token, signal });
}
