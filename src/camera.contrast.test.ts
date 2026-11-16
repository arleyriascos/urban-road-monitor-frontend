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

// The link color lives in the map stylesheet: first the light value, then the dark one.
const mapCss = readFileSync(resolve(process.cwd(), 'src', 'map.css'), 'utf8');
const [lightLink, darkLink] = [...mapCss.matchAll(/--route-text:\s*([^;]+);/g)].map((m) =>
  m[1].trim(),
);

const light: Tokens = {
  ...tokensIn(css.slice(0, css.indexOf('@media (prefers-color-scheme: dark)'))),
  'route-text': lightLink,
};
const dark: Tokens = { ...light, ...tokensIn(darkBlock()), 'route-text': darkLink };

// What is written on the camera screen and on what: the page, the cards, the dark video area
// and the buttons.
const PAIRS: [text: string, background: string][] = [
  ['asphalt', 'surface'],
  ['muted', 'surface'],
  // The link of the top bar of the map, which sits on the card color.
  ['route-text', 'surface'],
  ['surface', 'asphalt'],
  ['asphalt', 'concrete'],
  ['muted', 'concrete'],
];

describe.each([
  ['light', light],
  ['dark', dark],
] as const)('the camera screen in the %s theme', (_name, theme) => {
  it.each(PAIRS)('%s on %s reaches 4.5', (text, background) => {
    expect(theme[text], text).toBeDefined();
    expect(theme[background], background).toBeDefined();
    expect(contrastRatio(theme[text]!, theme[background]!)).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST,
    );
  });

  it('shows the colors of the severity against the card, so the side bar can be seen', () => {
    for (const severity of ['severity-leve', 'severity-moderado', 'severity-grave']) {
      expect(contrastRatio(theme[severity]!, theme['surface']!)).toBeGreaterThanOrEqual(1.8);
    }
  });
});
