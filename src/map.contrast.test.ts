// The test reads the real stylesheets (Vitest returns empty text for CSS imports).
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MIN_TEXT_CONTRAST, contrastRatio } from './lib/contrast';

// Vitest runs from the project folder.
const read = (name: string) => readFileSync(resolve(process.cwd(), 'src', name), 'utf8');
const mapCss = read('map.css');
const stylesCss = read('styles.css');

type Tokens = Record<string, string>;

const DARK_MARKER = '@media (prefers-color-scheme: dark)';

/** The CSS that applies in the dark theme, and the rest of it. */
function splitByTheme(css: string): { light: string; dark: string } {
  let light = '';
  const dark: string[] = [];
  let index = 0;
  for (;;) {
    const start = css.indexOf(DARK_MARKER, index);
    if (start === -1) {
      light += css.slice(index);
      break;
    }
    light += css.slice(index, start);
    const open = css.indexOf('{', start);
    let depth = 0;
    let end = open;
    for (; end < css.length; end++) {
      if (css[end] === '{') depth++;
      if (css[end] === '}' && --depth === 0) break;
    }
    dark.push(css.slice(open + 1, end));
    index = end + 1;
  }
  return { light, dark: dark.join('\n') };
}

function customProperties(css: string): Tokens {
  const tokens: Tokens = {};
  for (const [, name, value] of css.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    tokens[name] = value.trim();
  }
  return tokens;
}

const parts = [mapCss, stylesCss].map(splitByTheme);
const light = customProperties(parts.map((part) => part.light).join('\n'));
const dark = { ...light, ...customProperties(parts.map((part) => part.dark).join('\n')) };

/** A token name, or a literal hex color. */
function color(theme: Tokens, reference: string): string {
  const value = reference.startsWith('#') ? reference : theme[reference];
  if (!value?.startsWith('#')) throw new Error(`No color for ${reference}`);
  return value;
}

/** The body of a rule of the map stylesheet, found by its exact selector. */
function rule(selector: string): string {
  const start = mapCss.indexOf(`\n${selector} {`);
  if (start === -1) throw new Error(`No rule for ${selector}`);
  return mapCss.slice(start, mapCss.indexOf('}', start));
}

const PAIRS: [text: string, background: string, what: string][] = [
  ['asphalt', 'surface', 'main text on the panel'],
  ['muted', 'surface', 'secondary text on the panel'],
  ['asphalt', 'concrete', 'text on the summary tiles'],
  ['muted', 'concrete', 'labels on the summary tiles'],
  ['route-text', 'surface', 'links on the panel'],
  ['route-fail', 'surface', 'error titles on the panel'],
  ['asphalt', 'pick-bg', 'name of the street picked in the list'],
  ['muted', 'pick-bg', 'details of the street picked in the list'],
  ['#ffffff', 'route', 'text on the route blue buttons'],
  ['#ffffff', '#7c3aed', 'number of the street picked'],
];

describe.each([
  ['light', light],
  ['dark', dark],
] as const)('contrast in the %s theme', (_name, theme) => {
  it.each(PAIRS)('%s on %s (%s) reaches 4.5', (text, background) => {
    const ratio = contrastRatio(color(theme, text), color(theme, background));
    expect(ratio).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });
});

describe('the route panel colors follow the theme', () => {
  it('defines the picked street, link and error colors for the dark theme too', () => {
    for (const name of ['route-text', 'route-fail', 'pick-bg']) {
      expect(dark[name], name).toBeDefined();
      expect(dark[name], name).not.toBe(light[name]);
    }
  });

  it.each([
    ["\n.route-steps__item[aria-current='step']", 'background: var(--pick-bg)'],
    ['.route-details > summary', 'color: var(--route-text)'],
    ['.route-link-button', 'color: var(--route-text)'],
    ['.route-link', 'color: var(--route-text)'],
    ['.route-status--error .route-status__title', 'color: var(--route-fail)'],
    ['.route-compare__note--error', 'color: var(--route-fail)'],
  ])('%s uses a theme color', (selector, declaration) => {
    expect(rule(selector.trim())).toContain(declaration);
  });

  it('does not hard-code a light background for the street picked', () => {
    expect(rule("\n.route-steps__item[aria-current='step']".trim())).not.toMatch(/#ede9fe/i);
  });
});
