import { afterEach, describe, expect, it } from 'vitest';
import { clearLinkFragment, readLinkToken } from './email-links';

const TOKEN = 'Ab3_-'.repeat(8) + 'xyz';

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('readLinkToken', () => {
  it('reads a token of the right shape from the part after "#"', () => {
    expect(TOKEN).toHaveLength(43);
    expect(readLinkToken(`#token=${TOKEN}`)).toBe(TOKEN);
    expect(readLinkToken(`token=${TOKEN}`)).toBe(TOKEN);
  });

  it.each([
    ['nothing', ''],
    ['only the hash sign', '#'],
    ['another name', `#code=${TOKEN}`],
    ['a short token', `#token=${TOKEN.slice(1)}`],
    ['a long token', `#token=${TOKEN}a`],
    ['strange characters', `#token=${'$'.repeat(43)}`],
    ['an empty token', '#token='],
  ])('gives nothing for %s', (_name, hash) => {
    expect(readLinkToken(hash)).toBeNull();
  });
});

describe('clearLinkFragment', () => {
  it('leaves the path and the query, and takes the token out of the address', () => {
    window.history.replaceState(null, '', `/restablecer?x=1#token=${TOKEN}`);

    clearLinkFragment();

    expect(window.location.pathname).toBe('/restablecer');
    expect(window.location.search).toBe('?x=1');
    expect(window.location.hash).toBe('');
  });
});
