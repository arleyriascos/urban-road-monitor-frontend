import { describe, expect, it } from 'vitest';
import { LOCALES } from './locale';
import { messagesOf } from './translate';

const PLACEHOLDER = /\{(\w+)\}/g;

function placeholdersOf(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER)].map((match) => match[1] as string).sort();
}

const spanish = messagesOf('es');
const english = messagesOf('en');
const keys = Object.keys(spanish);

describe('the dictionaries', () => {
  it('have the same keys in every language, none missing and none extra', () => {
    for (const locale of LOCALES) {
      expect(Object.keys(messagesOf(locale)).sort()).toEqual([...keys].sort());
    }
  });

  it('write every key as area.name, in lowercase', () => {
    for (const key of keys) {
      expect(key).toMatch(/^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)+$/);
    }
  });

  it('have no empty text and no text with spaces at the ends', () => {
    for (const locale of LOCALES) {
      for (const [key, text] of Object.entries(messagesOf(locale))) {
        expect(text.trim(), `${locale} ${key}`).not.toBe('');
        expect(text, `${locale} ${key}`).toBe(text.trim());
      }
    }
  });

  it('keep the same placeholders in both languages', () => {
    for (const key of keys) {
      const k = key as keyof typeof spanish;
      expect(placeholdersOf(english[k]), key).toEqual(placeholdersOf(spanish[k]));
    }
  });

  it('use no half-written placeholders', () => {
    for (const locale of LOCALES) {
      for (const [key, text] of Object.entries(messagesOf(locale))) {
        const withoutPlaceholders = text.replace(PLACEHOLDER, '');
        expect(withoutPlaceholders, `${locale} ${key}`).not.toMatch(/[{}]/);
      }
    }
  });

  it('have a name for every language of the app', () => {
    for (const locale of LOCALES) {
      expect(keys).toContain(`language.name.${locale}`);
    }
  });
});
