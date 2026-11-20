import type { ApiError } from '../api/http';
import { PASSWORD_MAX, PASSWORD_MIN } from './email-auth';
import { inDefaultLanguage, type Translator } from './translator';

export interface SignInErrorDescription {
  title: string;
  help: string;
}

/** The only answer that means "this session is over": a timeout or a 503 does not. */
export function isSessionGone(error: Pick<ApiError, 'kind' | 'status'>): boolean {
  return error.kind === 'http' && error.status === 401;
}

/** Why the backend refused a password: the rule it breaks, in the person's language. */
export function describePasswordProblem(
  details: Record<string, unknown> | undefined,
  t: Translator = inDefaultLanguage,
): string {
  switch (details?.problem) {
    case 'too_short':
      return t('authError.password.tooShort', { min: PASSWORD_MIN });
    case 'too_long':
      return t('authError.password.tooLong', { max: PASSWORD_MAX });
    case 'same_as_email':
      return t('authError.password.sameAsEmail');
    case 'too_common':
      return t('authError.password.tooCommon');
    case 'same_as_current':
      return t('authError.password.sameAsCurrent');
    default:
      return t('authError.password.other');
  }
}

/**
 * Plain explanation of why signing in or signing up failed and what to do, in the person's
 * language. It is for Google and for the email and password: the code of the answer says which.
 */
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
  if (error.code === 'INVALID_CREDENTIALS') {
    return { title: t('authError.credentials.title'), help: t('authError.credentials.help') };
  }
  if (error.code === 'EMAIL_TAKEN') {
    return { title: t('authError.emailTaken.title'), help: t('authError.emailTaken.help') };
  }
  if (error.code === 'INVALID_PASSWORD') {
    return {
      title: t('authError.password.title'),
      help: describePasswordProblem(error.details, t),
    };
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
