// The test reads the real stylesheet (Vitest returns empty text for CSS imports).
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MIN_TEXT_CONTRAST, contrastRatio } from './lib/contrast';

const css = readFileSync(resolve(process.cwd(), 'src', 'styles.css'), 'utf8');

type Tokens = Record<string, string>;

function tokensIn(block: string): Tokens {
  const tokens: Tokens = {};
  for (const [, name, value] of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    tokens[name] = value.trim();
  }
  return tokens;
}

/** The body of the dark theme block, found by its opening line, up to its closing brace. */
function darkBlock(): string {
  const start = css.indexOf('@media (prefers-color-scheme: dark)');
  const open = css.indexOf('{', start);
  let depth = 0;
  let end = open;
  for (; end < css.length; end++) {
    if (css[end] === '{') depth++;
    if (css[end] === '}' && --depth === 0) break;
  }
  return css.slice(open + 1, end);
}

const light = tokensIn(css.slice(0, css.indexOf('@media (prefers-color-scheme: dark)')));
const dark = { ...light, ...tokensIn(darkBlock()) };

// What is written on the left panel, and on what it can end up: the plain panel, the card
// with the numbers, and (worst case) a main street that runs under the text.
const PAIRS: [text: string, background: string][] = [
  ['hero-text', 'hero-bg'],
  ['hero-muted', 'hero-bg'],
  ['hero-accent', 'hero-bg'],
  ['hero-text', 'hero-card'],
  ['hero-muted', 'hero-card'],
  ['hero-text', 'hero-main'],
  ['hero-muted', 'hero-main'],
  // The right side, in the page colors.
  ['asphalt', 'surface'],
  ['muted', 'surface'],
];

describe.each([
  ['light', light],
  ['dark', dark],
] as const)('the entry screen in the %s theme', (_name, theme) => {
  it.each(PAIRS)('%s on %s reaches 4.5', (text, background) => {
    expect(theme[text], text).toBeDefined();
    expect(theme[background], background).toBeDefined();
    expect(contrastRatio(theme[text]!, theme[background]!)).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST,
    );
  });

  it('keeps the streets visible against the panel, but quieter than the text', () => {
    const streets = contrastRatio(theme['hero-main']!, theme['hero-bg']!);
    const sideStreets = contrastRatio(theme['hero-side']!, theme['hero-bg']!);

    expect(streets).toBeGreaterThan(1.8);
    expect(sideStreets).toBeGreaterThan(1.2);
    expect(sideStreets).toBeLessThan(streets);
    expect(streets).toBeLessThan(MIN_TEXT_CONTRAST);
  });
});

describe('the dark theme', () => {
  it('makes the left panel deeper than in the light theme', () => {
    expect(dark['hero-bg']).not.toBe(light['hero-bg']);
  });
});
