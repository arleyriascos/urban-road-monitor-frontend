import { useContext } from 'react';
import { LanguageContext, type LanguageValue } from './language-context';

/** The current language, a way to change it, and `t` to write the texts of the app. */
export function useLanguage(): LanguageValue {
  return useContext(LanguageContext);
}
