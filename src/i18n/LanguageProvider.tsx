import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LanguageContext, type LanguageValue } from './language-context';
import { createLanguageStore, type LanguageStore } from './language-store';
import { isLocale, type Locale } from './locale';
import { translate } from './translate';

interface LanguageProviderProps {
  /** Where the choice is kept. Tests give their own; the app uses the browser's storage. */
  store?: LanguageStore;
  children: ReactNode;
}

/**
 * Gives the whole app its language: the one saved in the browser or, the first time, Spanish.
 * It also tells the page (`<html lang>`), so screen readers and translators know the language.
 */
export function LanguageProvider({ store, children }: LanguageProviderProps) {
  const [languageStore] = useState<LanguageStore>(() => store ?? createLanguageStore());
  const [locale, setCurrent] = useState<Locale>(() => languageStore.read());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (!isLocale(next)) return;
      setCurrent(next);
      languageStore.save(next);
    },
    [languageStore],
  );

  const value = useMemo<LanguageValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => translate(locale, key, params),
    }),
    [locale, setLocale],
  );

  return <LanguageContext value={value}>{children}</LanguageContext>;
}
