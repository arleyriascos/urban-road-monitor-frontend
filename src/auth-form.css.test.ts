// The test reads the real stylesheets (Vitest returns empty text for CSS imports).
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MIN_TEXT_CONTRAST, contrastRatio } from './lib/contrast';

const read = (name: string) => readFileSync(resolve(process.cwd(), 'src', name), 'utf8');
const css = read('auth-form.css');
const tokensCss = read('styles.css');

type Tokens = Record<string, string>;

function tokensIn(block: string): Tokens {
  const tokens: Tokens = {};
  for (const [, name, value] of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    tokens[name] = value.trim();
  }
  return tokens;
}

const DARK_START = tokensCss.indexOf('@media (prefers-color-scheme: dark)');
const light = tokensIn(tokensCss.slice(0, DARK_START));
const dark = {
  ...light,
  ...tokensIn(tokensCss.slice(DARK_START, tokensCss.indexOf('*,', DARK_START))),
};

describe('the access form stylesheet', () => {
  it('takes every color from the design tokens, so both themes work', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\b(rgb|hsl)a?\(/);
  });

  it('makes the boxes and the eye at least 44px on phones, for the finger', () => {
    const phone = css.slice(css.indexOf('@media (max-width: 640px)'));
    expect(phone).toMatch(/\.auth-field__box\s*{[^}]*min-height:\s*5\dpx/);
    expect(phone).toMatch(/\.auth-field__toggle\s*{[^}]*width:\s*44px[^}]*height:\s*44px/);
  });

  it('shows where the keyboard is: the box lights up and the eye has an outline', () => {
    expect(css).toMatch(/\.auth-field__box:focus-within\s*{[^}]*border-color:\s*var\(--focus\)/);
    expect(css).toMatch(/\.auth-field__toggle:focus-visible\s*{[^}]*outline:/);
  });

  it('paints a field with an error in the failure color', () => {
    expect(css).toMatch(/\.auth-field__box--error[^{]*{[^}]*border-color:\s*var\(--fail\)/);
    expect(css).toMatch(/\.auth-field__error\s*{[^}]*color:\s*var\(--fail\)/);
  });

  it('does not hide the outline of the input without drawing another one on the box', () => {
    expect(css).toMatch(/\.auth-field__input\s*{[^}]*outline:\s*0/);
    expect(css).toMatch(/\.auth-field__box:focus-within/);
  });
});

describe.each([
  ['light', light],
  ['dark', dark],
] as const)('the access fields in the %s theme', (_name, theme) => {
  // What is typed, the icon and the placeholder, the hint, the error, and the eye on hover.
  const PAIRS: [text: string, background: string][] = [
    ['asphalt', 'surface'],
    ['muted', 'surface'],
    ['fail', 'surface'],
    ['brand-ink', 'brand-soft'],
  ];

  it.each(PAIRS)('%s on %s reaches 4.5', (text, background) => {
    expect(theme[text], text).toBeDefined();
    expect(theme[background], background).toBeDefined();
    expect(contrastRatio(theme[text]!, theme[background]!)).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST,
    );
  });
});
