import { LOCALES } from './locale';
import { useLanguage } from './useLanguage';

/**
 * Two buttons to choose the language, each named in its own language. The chosen one is marked
 * for screen readers with `aria-pressed`, and each button carries its own `lang`, so a screen
 * reader says "English" with English sounds even when the app is in Spanish.
 */
export function LanguageSwitch() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className="language-switch" role="group" aria-label={t('language.label')}>
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          className="language-switch__option"
          aria-pressed={locale === code}
          onClick={() => setLocale(code)}
        >
          {t(`language.name.${code}`)}
        </button>
      ))}
    </div>
  );
}
