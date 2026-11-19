import type { ApiError } from '../api/http';
import { DEFAULT_LOCALE } from '../i18n/locale';
import { translate, type MessageKey, type MessageParams } from '../i18n/translate';

export interface SignInErrorDescription {
  title: string;
  help: string;
}

/** The only answer that means "this session is over": a timeout or a 503 does not. */
export function isSessionGone(error: Pick<ApiError, 'kind' | 'status'>): boolean {
  return error.kind === 'http' && error.status === 401;
}

/** How a text is written: `t` of the language of the app. Spanish when none is given. */
type Translator = (key: MessageKey, params?: MessageParams) => string;

const inDefaultLanguage: Translator = (key, params) => translate(DEFAULT_LOCALE, key, params);

/** Plain explanation of why signing in with Google failed and what to do, in the person's language. */
export function describeSignInError(
  error: Pick<ApiError, 'kind' | 'status' | 'code' | 'details'>,
  t: Translator = inDefaultLanguage,
): SignInErrorDescription {
  if (error.kind === 'timeout') {
    return { title: t('authError.timeout.title'), help: t('authError.timeout.help') };
  }
  if (error.kind === 'network') {
    return { title: t('authError.network.title'), help: t('authError.network.help') };
  }
  if (error.status === 401) {
    return { title: t('authError.unverified.title'), help: t('authError.unverified.help') };
  }
  if (error.status === 403) {
    return { title: t('authError.disabled.title'), help: t('authError.disabled.help') };
  }
  if (error.status === 429) {
    const seconds = error.details?.retryAfterS;
    const wait =
      typeof seconds === 'number' && seconds > 0
        ? Math.ceil(seconds) === 1
          ? t('authError.tooMany.helpOneSecond')
          : t('authError.tooMany.helpSeconds', { seconds: Math.ceil(seconds) })
        : t('authError.tooMany.helpMinute');
    return { title: t('authError.tooMany.title'), help: wait };
  }
  if (error.status === 503) {
    return { title: t('authError.unavailable.title'), help: t('authError.unavailable.help') };
  }
  return { title: t('authError.other.title'), help: t('authError.other.help') };
}
