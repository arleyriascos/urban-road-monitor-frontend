import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { LanguageProvider } from '../i18n/LanguageProvider';
import type { LanguageStore } from '../i18n/language-store';
import { translate } from '../i18n/translate';
import type { Texts } from '../lib/translator';

/** A store that already holds English and keeps nothing, so a test never touches the browser. */
const englishStore: LanguageStore = { read: () => 'en', save: () => undefined };

/** Renders a piece of the app as a person who chose English would see it. */
export function renderInEnglish(ui: ReactElement) {
  return render(<LanguageProvider store={englishStore}>{ui}</LanguageProvider>);
}

/** The language of a person who chose English, for the functions that build texts. */
export const englishTexts: Texts = {
  locale: 'en',
  t: (key, params) => translate('en', key, params),
};
