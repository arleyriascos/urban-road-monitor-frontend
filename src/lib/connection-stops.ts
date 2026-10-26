export type StopStatus = 'reached' | 'pending' | 'failed';

/** What the route needs to know about a request, whichever request it is. */
export type RouteState =
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error'; error: { kind: 'network' | 'timeout' | 'http'; status?: number } };

export interface Stop {
  name: string;
  detail: string;
}

export const STOPS: readonly Stop[] = [
  { name: 'Tu navegador', detail: 'Frontend en Vercel' },
  { name: 'Servidor', detail: 'API REST en Render' },
  { name: 'Base de datos', detail: 'PostgreSQL en Neon' },
];

/**
 * Status of each stop for the current state.
 * A 503 means the server answered but the database did not.
 */
export function getStopStatuses(state: RouteState): StopStatus[] {
  if (state.status === 'success') return ['reached', 'reached', 'reached'];
  if (state.status === 'loading') return ['reached', 'pending', 'pending'];
  if (state.error.kind === 'http' && state.error.status === 503) {
    return ['reached', 'reached', 'failed'];
  }
  return ['reached', 'failed', 'pending'];
}
