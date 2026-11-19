import { describe, expect, it } from 'vitest';
import { fillPlaceholders, messagesOf, translate } from './translate';

describe('translate', () => {
  it('gives the text of the key in each language', () => {
    expect(translate('es', 'language.label')).toBe('Idioma');
    expect(translate('en', 'language.label')).toBe('Language');
  });

  it('writes the name of each language in that language', () => {
    for (const locale of ['es', 'en'] as const) {
      expect(translate(locale, 'language.name.es')).toBe('Español');
      expect(translate(locale, 'language.name.en')).toBe('English');
    }
  });

  it('is the same text as the dictionary, with no parameters or with empty ones', () => {
    expect(translate('en', 'language.label')).toBe(messagesOf('en')['language.label']);
    expect(translate('es', 'language.label', {})).toBe(messagesOf('es')['language.label']);
  });
});

describe('fillPlaceholders', () => {
  it('replaces a placeholder, with text or with a number', () => {
    expect(fillPlaceholders('{count} calles en {place}', { count: 4610, place: 'Pasto' })).toBe(
      '4610 calles en Pasto',
    );
  });

  it('replaces every appearance of the same placeholder', () => {
    expect(fillPlaceholders('{a}-{a}-{b}', { a: 'x', b: 'y' })).toBe('x-x-y');
  });

  it('keeps a placeholder that has no value, so the mistake is visible', () => {
    expect(fillPlaceholders('Hola {name}', { other: 'x' })).toBe('Hola {name}');
    expect(fillPlaceholders('Hola {name}', {})).toBe('Hola {name}');
  });

  it('never expands a value that looks like a placeholder', () => {
    expect(fillPlaceholders('Calle {street} de {city}', { street: '{city}', city: 'Pasto' })).toBe(
      'Calle {city} de Pasto',
    );
  });

  it('writes the special characters of a value as they are', () => {
    expect(fillPlaceholders('Calle {street}', { street: "$& $1 $' $$" })).toBe("Calle $& $1 $' $$");
  });

  it('does not take a name that only the prototype has', () => {
    expect(fillPlaceholders('{toString} {constructor}', {})).toBe('{toString} {constructor}');
  });

  it('writes a zero as 0, not as nothing', () => {
    expect(fillPlaceholders('{count} baches', { count: 0 })).toBe('0 baches');
  });

  it('leaves a text without placeholders as it is', () => {
    expect(fillPlaceholders('Sin variables { } {1a} {}', { a: 'x' })).toBe(
      'Sin variables { } {1a} {}',
    );
  });
});
