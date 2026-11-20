import type {
  AccountProfile,
  ChangePasswordAnswer,
  GoogleLoginAnswer,
  PasswordSessionAnswer,
} from '../types/auth';
import { getJson, postEmpty, postJson } from './http';

/** Gives Google's ID token to the backend and receives a session of its own. */
export function signInWithGoogle(
  credential: string,
  signal?: AbortSignal,
): Promise<GoogleLoginAnswer> {
  return postJson<GoogleLoginAnswer>('/api/auth/google', { credential }, { signal });
}

/** Makes an account with an email and a password and receives its session. */
export function registerWithPassword(
  input: { name: string; email: string; password: string },
  signal?: AbortSignal,
): Promise<PasswordSessionAnswer> {
  return postJson<PasswordSessionAnswer>('/api/auth/register', input, { signal });
}

/** Signs in with an email and a password and receives a session. */
export function signInWithPassword(
  input: { email: string; password: string },
  signal?: AbortSignal,
): Promise<PasswordSessionAnswer> {
  return postJson<PasswordSessionAnswer>('/api/auth/login', input, { signal });
}

/**
 * Changes the password of the session's account. The backend closes the person's OTHER
 * sessions; this one stays. A wrong current password is a 403, never a 401, so it does not
 * look like a session that ended.
 */
export function changePassword(
  token: string,
  input: { currentPassword: string; newPassword: string },
  signal?: AbortSignal,
): Promise<ChangePasswordAnswer> {
  return postJson<ChangePasswordAnswer>('/api/auth/password', input, { token, signal });
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
