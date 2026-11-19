import { DEFAULT_LOCALE, isLocale, type Locale } from './locale';

const LANGUAGE_KEY = 'urban-road-monitor.language';

/**
 * The language the person chose, kept in the browser between visits. localStorage can be missing
 * or throw (private windows, blocked site data), so every access is protected: without it the
 * app still works, it just goes back to the default language on the next visit.
 */
export interface LanguageStore {
  /** The saved language, or the default one when nothing valid is saved. */
  read(): Locale;
  save(locale: Locale): void;
}

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function createLanguageStore(
  getStorage: () => Storage | null = browserStorage,
): LanguageStore {
  return {
    read() {
      try {
        const storage = getStorage();
        const value = storage?.getItem(LANGUAGE_KEY) ?? null;
        if (value === null) return DEFAULT_LOCALE;
        if (isLocale(value)) return value;
        storage?.removeItem(LANGUAGE_KEY); // Something else wrote here: it is not a language.
        return DEFAULT_LOCALE;
      } catch {
        return DEFAULT_LOCALE;
      }
    },
    save(locale) {
      try {
        getStorage()?.setItem(LANGUAGE_KEY, locale);
      } catch {
        // Nothing to do: the choice is only forgotten when the page closes.
      }
    },
  };
}
