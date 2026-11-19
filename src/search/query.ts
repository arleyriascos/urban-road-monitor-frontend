import type { ApiError } from '../api/http';
import { retryAfterSeconds } from '../lib/route-errors';
import { inDefaultLanguage, type Translator } from '../lib/translator';

/** Fewer letters than this match too many streets to be of use: the search waits for more. */
export const MIN_QUERY_LENGTH = 2;

/** The backend accepts up to 100 characters. */
export const MAX_QUERY_LENGTH = 100;

/** How long the person must stop typing before the search asks the server. */
export const SEARCH_DEBOUNCE_MS = 300;

/** How many suggestions are asked for: a list that fits a phone screen. */
export const SUGGESTION_LIMIT = 8;

/**
 * What is sent to the server: the text without the spaces at the ends or repeated inside,
 * cut to the largest size the server accepts. Capitals and accents do not matter: the
 * server ignores them.
 */
export function cleanQuery(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_LENGTH).trim();
}

/** True when the text is long enough to search for. */
export function isSearchable(text: string): boolean {
  return cleanQuery(text).length >= MIN_QUERY_LENGTH;
}

export interface SearchErrorDescription {
  text: string;
}

/** Plain explanation of why the suggestions did not come, in the person's language. */
export function describeSearchError(
  error: Pick<ApiError, 'kind' | 'status' | 'details'>,
  t: Translator = inDefaultLanguage,
): SearchErrorDescription {
  if (error.kind === 'network') return { text: t('search.error.network') };
  if (error.kind === 'timeout') return { text: t('search.error.timeout') };
  if (error.status === 429) {
    const seconds = retryAfterSeconds(error);
    return {
      text:
        seconds !== undefined && seconds > 0
          ? t('search.error.tooManySeconds', { seconds: Math.ceil(seconds) })
          : t('search.error.tooMany'),
    };
  }
  return { text: t('search.error.other') };
}
