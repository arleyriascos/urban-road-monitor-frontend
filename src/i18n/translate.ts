import type { Locale } from './locale';
import { en } from './messages.en';
import { es, type MessageKey } from './messages.es';

export type { MessageKey };

/** The values that go in the {placeholders} of a text. */
export type MessageParams = Record<string, string | number>;

const MESSAGES: Record<Locale, Record<MessageKey, string>> = { es, en };

/**
 * Puts the values in the {placeholders} of a text.
 *
 * The replacement is done in one pass, so a value that itself looks like a placeholder (a
 * street named "{name}") is shown as it is and never expanded. A placeholder without a value
 * stays visible, which makes a forgotten parameter easy to see.
 */
export function fillPlaceholders(text: string, params: MessageParams): string {
  return text.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : placeholder,
  );
}

/** The text of a key in a language, with the {placeholders} replaced. */
export function translate(locale: Locale, key: MessageKey, params?: MessageParams): string {
  const text = MESSAGES[locale][key];
  return params ? fillPlaceholders(text, params) : text;
}

/** The dictionary of a language, for tests and tools that walk through every text. */
export function messagesOf(locale: Locale): Record<MessageKey, string> {
  return MESSAGES[locale];
}
