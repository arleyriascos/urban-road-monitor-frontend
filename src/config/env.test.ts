import { describe, expect, it } from 'vitest';
import { optionalUrl } from './env';

describe('optionalUrl', () => {
  it('removes spaces and trailing slashes', () => {
    expect(optionalUrl(' https://ai.example.com/ ')).toBe('https://ai.example.com');
  });

  it.each([undefined, '', '   ', '/'])('is null for %j', (value) => {
    expect(optionalUrl(value)).toBeNull();
  });
});
