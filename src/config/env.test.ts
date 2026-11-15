import { describe, expect, it } from 'vitest';
import { optionalText, optionalUrl } from './env';

describe('optionalUrl', () => {
  it('removes spaces and trailing slashes', () => {
    expect(optionalUrl(' https://ai.example.com/ ')).toBe('https://ai.example.com');
  });

  it.each([undefined, '', '   ', '/'])('is null for %j', (value) => {
    expect(optionalUrl(value)).toBeNull();
  });
});

describe('optionalText', () => {
  it('removes the spaces around the text and keeps the rest as it is', () => {
    expect(optionalText(' abc.def/ghi ')).toBe('abc.def/ghi');
  });

  it.each([undefined, '', '   '])('is null for %j', (value) => {
    expect(optionalText(value)).toBeNull();
  });
});
