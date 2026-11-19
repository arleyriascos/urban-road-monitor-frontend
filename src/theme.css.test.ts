// The test reads the real stylesheets (Vitest returns empty text for CSS imports).
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (name: string) => readFileSync(resolve(process.cwd(), 'src', name), 'utf8');
const styles = read('styles.css');
const map = read('map.css');

/** The text inside the braces that follow `opening`, which must start a block. */
function blockAfter(css: string, opening: string): string {
  const start = css.indexOf(opening);
  expect(start, opening).toBeGreaterThanOrEqual(0);
  const open = css.indexOf('{', start);
  let depth = 0;
  let end = open;
  for (; end < css.length; end++) {
    if (css[end] === '{') depth++;
    if (css[end] === '}' && --depth === 0) break;
  }
  return css.slice(open + 1, end);
}

const properties = (block: string) =>
  [...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(
    ([, name, value]) => `${name}: ${value!.trim()}`,
  );

describe('the theme the person chooses', () => {
  it('the dark theme of the settings has the same colors as the dark theme of the device', () => {
    const device = properties(blockAfter(styles, ":root:not([data-theme='light']) {"));
    const chosen = properties(blockAfter(styles, ":root[data-theme='dark'] {"));

    expect(device.length).toBeGreaterThan(10);
    expect(chosen).toEqual(device);
  });

  it('the dark theme of the device does not apply when the person chose the light one', () => {
    const media = blockAfter(styles, '@media (prefers-color-scheme: dark)');
    expect(media).toContain(":root:not([data-theme='light'])");
    expect(media).not.toMatch(/(^|\n)\s*:root\s*{/);
  });

  it('tells the browser which theme the page is in, for the scrollbars and the fields', () => {
    expect(blockAfter(styles, ":root[data-theme='light'] {")).toContain('color-scheme: light');
    expect(blockAfter(styles, ":root[data-theme='dark'] {")).toContain('color-scheme: dark');
  });

  it('the colors of the route panel follow the choice too', () => {
    const device = properties(blockAfter(map, ":root:not([data-theme='light']) .map-app {"));
    const chosen = properties(blockAfter(map, ":root[data-theme='dark'] .map-app {"));

    expect(device).toEqual([
      '--route-text: #8ab4ff',
      '--route-fail: #f28b77',
      '--pick-bg: #3b2a73',
    ]);
    expect(chosen).toEqual(device);
  });
});
