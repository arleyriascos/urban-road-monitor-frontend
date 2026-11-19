import type { MessageKey } from '../i18n/translate';

export type StopStatus = 'reached' | 'pending' | 'failed';

/** What the route needs to know about a request, whichever request it is. */
export type RouteState =
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error'; error: { kind: 'network' | 'timeout' | 'http'; status?: number } };

/** A stop of the road, with the keys of the texts that name it and say what it is. */
export interface Stop {
  id: 'browser' | 'server' | 'database';
  nameKey: MessageKey;
  detailKey: MessageKey;
}

export const STOPS: readonly Stop[] = [
  { id: 'browser', nameKey: 'connection.browser.name', detailKey: 'connection.browser.detail' },
  { id: 'server', nameKey: 'connection.server.name', detailKey: 'connection.server.detail' },
  {
    id: 'database',
    nameKey: 'connection.database.name',
    detailKey: 'connection.database.detail',
  },
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
