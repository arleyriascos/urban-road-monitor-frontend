import type { ApiError } from '../api/http';
import { inDefaultLanguage, type Translator } from './translator';

export interface ErrorDescription {
  title: string;
  help: string;
}

/** Plain explanation of what went wrong and what the person can do, in their language. */
export function describeError(
  error: Pick<ApiError, 'kind' | 'status'>,
  t: Translator = inDefaultLanguage,
): ErrorDescription {
  if (error.kind === 'timeout') {
    return { title: t('apiError.timeout.title'), help: t('apiError.timeout.help') };
  }
  if (error.kind === 'network') {
    return { title: t('apiError.network.title'), help: t('apiError.network.help') };
  }
  if (error.status === 503) {
    return { title: t('apiError.database.title'), help: t('apiError.database.help') };
  }
  return {
    title: t('apiError.other.title', {
      status: error.status ?? t('apiError.other.unknown'),
    }),
    help: t('apiError.other.help'),
  };
}
