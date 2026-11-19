// The test reads the real stylesheets (Vitest returns empty text for CSS imports).
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MIN_TEXT_CONTRAST, contrastRatio } from './lib/contrast';

const read = (name: string) => readFileSync(resolve(process.cwd(), 'src', name), 'utf8');
const css = read('language.css');
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

describe('the language switch stylesheet', () => {
  it('takes every color from the design tokens, so both themes work', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\b(rgb|hsl)a?\(/);
  });

  it('makes each option at least 44px tall on phones, for the finger', () => {
    const phone = css.slice(css.indexOf('@media (max-width: 640px)'));
    expect(phone).toMatch(/\.language-switch__option\s*{[^}]*min-height:\s*44px/);
  });

  it('shows where the keyboard is, and which option is chosen', () => {
    expect(css).toMatch(/\.language-switch__option:focus-visible\s*{[^}]*outline:/);
    expect(css).toMatch(/\.language-switch__option\[aria-pressed='true'\]/);
  });
});

describe.each([
  ['light', light],
  ['dark', dark],
] as const)('the language switch in the %s theme', (_name, theme) => {
  // The option that is not chosen, the one under the pointer, and the chosen one.
  const PAIRS: [text: string, background: string][] = [
    ['muted', 'surface'],
    ['brand-ink', 'brand-soft'],
    ['on-brand', 'brand'],
  ];

  it.each(PAIRS)('%s on %s reaches 4.5', (text, background) => {
    expect(theme[text], text).toBeDefined();
    expect(theme[background], background).toBeDefined();
    expect(contrastRatio(theme[text]!, theme[background]!)).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST,
    );
  });
});
