import { inDefaultLanguage, type Translator } from '../lib/translator';

/** Why the GPS gives no position, in words for the person. */
export type GpsProblem = 'denied' | 'unavailable' | 'unsupported';

/** The numbers of GeolocationPositionError, so the code does not depend on the browser object. */
const PERMISSION_DENIED = 1;

export function classifyGpsError(error: { code?: number } | null | undefined): GpsProblem {
  return error?.code === PERMISSION_DENIED ? 'denied' : 'unavailable';
}

export function describeGpsProblem(problem: GpsProblem, t: Translator = inDefaultLanguage): string {
  switch (problem) {
    case 'denied':
      return t('gps.denied');
    case 'unsupported':
      return t('gps.unsupported');
    case 'unavailable':
      return t('gps.unavailable');
  }
}
