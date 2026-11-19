import { DEFAULT_LOCALE, type Locale } from '../i18n/locale';
import { translate, type MessageKey, type MessageParams } from '../i18n/translate';

/** How a text is written: `t` of the language of the app. */
export type Translator = (key: MessageKey, params?: MessageParams) => string;

/** Spanish, the language used when a piece of the app is given no other one. */
export const inDefaultLanguage: Translator = (key, params) =>
  translate(DEFAULT_LOCALE, key, params);

/**
 * What the functions that build a text need to know about the language: the translator and the
 * locale (for the separators of the numbers and the format of the dates). `useLanguage()` gives
 * exactly this, and Spanish is used when nothing is given.
 */
export interface Texts {
  t: Translator;
  locale: Locale;
}

export const defaultTexts: Texts = { t: inDefaultLanguage, locale: DEFAULT_LOCALE };
