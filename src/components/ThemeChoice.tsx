import { useId } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { THEMES, type Theme } from '../theme/theme';
import { useTheme } from '../theme/useTheme';
import type { ThemeStore } from '../theme/theme-store';

/** Three radio buttons to choose the theme: it changes at once and is remembered. */
export function ThemeChoice({ store }: { store?: ThemeStore }) {
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme(store);
  const name = useId();

  return (
    <fieldset className="settings__choice">
      <legend className="settings__legend">{t('settings.theme.label')}</legend>
      {THEMES.map((option: Theme) => (
        <label key={option} className="settings__option">
          <input
            type="radio"
            name={name}
            value={option}
            checked={theme === option}
            onChange={() => setTheme(option)}
          />
          <span>{t(`settings.theme.${option}`)}</span>
        </label>
      ))}
    </fieldset>
  );
}
