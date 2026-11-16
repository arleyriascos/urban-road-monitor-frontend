import { useCallback, useEffect, useState } from 'react';
import { getMe } from '../api/auth';
import { ApiError } from '../api/http';
import { isSessionGone } from '../lib/auth-errors';
import { sessionStore, type SessionStore } from '../lib/session-storage';
import { accessOf, type SendAccess } from '../sending/access';

export interface SendAccessDependencies {
  store: Pick<SessionStore, 'readToken'>;
  getMe: typeof getMe;
}

const defaultDependencies: SendAccessDependencies = { store: sessionStore, getMe };

/** The wait before asking again when the backend did not answer. */
export const ACCESS_RETRY_MS = 10_000;

/**
 * Whether the person of this browser may record detections. The camera does not need a
 * session, so this reads the saved one on its own: no session means a guest; with one, the
 * backend says what it allows (GET /api/auth/me). A 401 means the session is over; a timeout
 * or a 503 say nothing about it, so the question is asked again.
 */
export function useSendAccess(
  dependencies: SendAccessDependencies = defaultDependencies,
): SendAccess {
  const { store, getMe: ask } = dependencies;
  const [token] = useState(() => store.readToken());
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState<{ attempt: number; access: SendAccess } | null>(null);

  useEffect(() => {
    if (token === null) return;
    const controller = new AbortController();
    ask(token, controller.signal)
      .then((profile) => setAnswer({ attempt, access: accessOf(profile, token) }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const gone = error instanceof ApiError && isSessionGone(error);
        setAnswer({ attempt, access: { status: gone ? 'session_over' : 'unreachable' } });
      });
    return () => controller.abort();
  }, [token, attempt, ask]);

  const unreachable = answer?.attempt === attempt && answer.access.status === 'unreachable';
  const again = useCallback(() => setAttempt((value) => value + 1), []);
  useEffect(() => {
    if (!unreachable) return;
    const timer = window.setTimeout(again, ACCESS_RETRY_MS);
    return () => window.clearTimeout(timer);
  }, [unreachable, again]);

  if (token === null) return { status: 'guest' };
  return answer?.attempt === attempt ? answer.access : { status: 'checking' };
}
