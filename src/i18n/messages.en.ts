import type { MessageKey } from './messages.es';

/** The same texts as `messages.es.ts`, in English: the same keys and the same {placeholders}. */
export const en: Record<MessageKey, string> = {
  'language.label': 'Language',
  'language.name.es': 'Español',
  'language.name.en': 'English',
  'form.error.emailRequired': 'Enter your email.',
  'form.error.emailInvalid': 'Check the email: it should look like name@example.com.',
  'form.error.passwordRequired': 'Enter your password.',
  'form.error.passwordShort': 'Use at least {min} characters.',
  'form.error.passwordLong': 'Use at most {max} characters.',
  'form.error.nameRequired': 'Enter your name.',
  'form.error.nameLong': 'Use at most {max} characters.',
};
