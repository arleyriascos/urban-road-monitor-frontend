/** The languages of the app: Spanish, the original one, and English. */
export const LOCALES = ['es', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

/** What a person sees until they choose another language. */
export const DEFAULT_LOCALE: Locale = 'es';

/** True for exactly the languages the app has; anything else (a stale or edited value) is not. */
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}
