/**
 * Every text of the app in Spanish, the original language. The English dictionary must have
 * exactly these keys (the compiler checks it), and each text must keep the same {placeholders}.
 *
 * Keys are `area.name`. A text with a variable part writes it as {name}.
 */
export const es = {
  'language.label': 'Idioma',
  // The name of each language is written in that language, so a person can find theirs.
  'language.name.es': 'Español',
  'language.name.en': 'English',
} as const;

export type MessageKey = keyof typeof es;
