import { createContext } from 'react';
import { DEFAULT_LOCALE, type Locale } from './locale';
import { translate, type MessageKey, type MessageParams } from './translate';

export interface LanguageValue {
  /** The language the app is shown in. */
  locale: Locale;
  /** Changes the language and remembers it for the next visit. */
  setLocale: (locale: Locale) => void;
  /** The text of a key in the current language. */
  t: (key: MessageKey, params?: MessageParams) => string;
}

/**
 * What a component gets when no provider is above it: Spanish, and a language that cannot be
 * changed. It lets a piece of the app be shown, or tested, on its own.
 */
export const DEFAULT_LANGUAGE: LanguageValue = {
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, params) => translate(DEFAULT_LOCALE, key, params),
};

export const LanguageContext = createContext<LanguageValue>(DEFAULT_LANGUAGE);
