import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api/http';
import { searchStreets } from '../api/roads';
import { cleanQuery, isSearchable, SEARCH_DEBOUNCE_MS, SUGGESTION_LIMIT } from '../search/query';
import type { StreetMatch, StreetSearchAnswer } from '../types/roads';

export interface StreetSearchDependencies {
  search: (
    query: string,
    options: { limit: number },
    signal: AbortSignal,
  ) => Promise<StreetSearchAnswer>;
  debounceMs: number;
}

const defaultDependencies: StreetSearchDependencies = {
  search: (query, options, signal) => searchStreets(query, options, signal),
  debounceMs: SEARCH_DEBOUNCE_MS,
};

/**
 * - `idle`: not enough text to search for.
 * - `loading`: the person is still typing, or the server has not answered yet.
 * - `results`: streets that match.
 * - `empty`: the server answered and nothing matches.
 */
export type StreetSearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'results'; streets: StreetMatch[] }
  | { status: 'empty' }
  | { status: 'error'; error: ApiError };

export interface StreetSearch {
  /** What is in the box. */
  text: string;
  setText: (text: string) => void;
  clear: () => void;
  state: StreetSearchState;
  /** After an error: ask again. */
  retry: () => void;
}

const IDLE: StreetSearchState = { status: 'idle' };
const LOADING: StreetSearchState = { status: 'loading' };

/**
 * The street search as the person types. It waits until they stop typing for a moment before
 * asking the server (the limit is 120 searches a minute), cancels the search that was left
 * behind, and never shows an answer for text that is no longer in the box.
 */
export function useStreetSearch(
  dependencies: StreetSearchDependencies = defaultDependencies,
): StreetSearch {
  const [text, setText] = useState('');
  const [retries, setRetries] = useState(0);
  // Each answer is kept with the search it belongs to, so a stale one is never shown.
  const [settled, setSettled] = useState<{ key: string; state: StreetSearchState } | null>(null);

  const query = cleanQuery(text);
  const searchable = isSearchable(text);
  const key = `${query}|${retries}`;
  const { search, debounceMs } = dependencies;

  useEffect(() => {
    if (!searchable) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      search(query, { limit: SUGGESTION_LIMIT }, controller.signal).then(
        (answer) => {
          if (controller.signal.aborted) return; // The person typed something else meanwhile.
          setSettled({
            key,
            state:
              answer.streets.length > 0
                ? { status: 'results', streets: answer.streets }
                : { status: 'empty' },
          });
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          setSettled({
            key,
            state: {
              status: 'error',
              error:
                error instanceof ApiError ? error : new ApiError('network', 'Unexpected error'),
            },
          });
        },
      );
    }, debounceMs);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchable, query, key, search, debounceMs]);

  const clear = useCallback(() => setText(''), []);
  const retry = useCallback(() => setRetries((value) => value + 1), []);

  let state: StreetSearchState = IDLE;
  if (searchable) state = settled?.key === key ? settled.state : LOADING;
  return { text, setText, clear, state, retry };
}
