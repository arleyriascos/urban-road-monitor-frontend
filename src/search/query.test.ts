import { describe, expect, it } from 'vitest';
import {
  cleanQuery,
  describeSearchError,
  isSearchable,
  MAX_QUERY_LENGTH,
  MIN_QUERY_LENGTH,
} from './query';

describe('cleanQuery', () => {
  it('trims the ends and joins repeated spaces', () => {
    expect(cleanQuery('  avenida    pasto \t')).toBe('avenida pasto');
  });

  it('keeps capitals and accents, which the server ignores', () => {
    expect(cleanQuery('AVENIDA Pastó')).toBe('AVENIDA Pastó');
  });

  it('cuts to the size the server accepts, without a space left at the end', () => {
    const long = `${'a'.repeat(MAX_QUERY_LENGTH - 1)} bbbbb`;
    const cleaned = cleanQuery(long);
    expect(cleaned.length).toBeLessThanOrEqual(MAX_QUERY_LENGTH);
    expect(cleaned.endsWith(' ')).toBe(false);
  });

  it('is empty for only spaces', () => {
    expect(cleanQuery('   ')).toBe('');
  });
});

describe('isSearchable', () => {
  it('needs at least two letters, not counting spaces around them', () => {
    expect(MIN_QUERY_LENGTH).toBe(2);
    expect(isSearchable('')).toBe(false);
    expect(isSearchable(' c ')).toBe(false);
    expect(isSearchable('ca')).toBe(true);
    expect(isSearchable('18')).toBe(true);
  });
});

describe('describeSearchError', () => {
  it('tells there is no connection', () => {
    expect(describeSearchError({ kind: 'network' }).text).toMatch(/Sin conexión/);
  });

  it('tells the server was slow', () => {
    expect(describeSearchError({ kind: 'timeout' }).text).toMatch(/tardó/);
  });

  it('tells to wait after too many searches, with the seconds when the server says them', () => {
    expect(describeSearchError({ kind: 'http', status: 429 }).text).toBe(
      'Demasiadas búsquedas. Espera un momento e intenta de nuevo.',
    );
    expect(
      describeSearchError({ kind: 'http', status: 429, details: { retryAfterS: 12.2 } }).text,
    ).toMatch(/Espera 13 segundos/);
  });

  it('has a general message for anything else', () => {
    expect(describeSearchError({ kind: 'http', status: 500 }).text).toBe(
      'No se pudo buscar ahora. Intenta de nuevo.',
    );
  });
});
