// The test reads the real stylesheet (Vitest returns empty text for CSS imports).
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src', 'account-page.css'), 'utf8');

describe('the account page stylesheet', () => {
  it('takes every color from the design tokens, so both themes work', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\b(rgb|hsl)a?\(/);
  });

  it('makes the links of the page at least 44px tall, for the finger', () => {
    expect(css).toMatch(/\.account-page__back\s*{[^}]*min-height:\s*44px/);
    expect(css).toMatch(/\.account-page__tab\s*{[^}]*min-height:\s*44px/);
  });

  it('marks the open part with the ink of the brand and a line, not only with color', () => {
    expect(css).toMatch(
      /\.account-page__tab\[aria-current='page'\]\s*{[^}]*border-bottom-color:\s*var\(--brand-ink\)/,
    );
  });

  it('lets the tabs scroll on a narrow screen instead of breaking the page', () => {
    expect(css).toMatch(/\.account-page__nav\s*{[^}]*overflow-x:\s*auto/);
  });

  it('breaks a long email instead of leaving the screen', () => {
    expect(css).toMatch(/\.account-profile__fields dd\s*{[^}]*overflow-wrap:\s*anywhere/);
  });

  it('shows the keyboard with an outline', () => {
    expect(css).toMatch(/\.account-page__tab:focus-visible/);
    expect(css).toMatch(/\.account-page__back:focus-visible/);
  });

  it('keeps the menu of the header above the content of the page', () => {
    const z = css.match(/\.account-page__header\s*{[^}]*z-index:\s*(\d+)/);
    expect(Number(z?.[1])).toBeGreaterThan(0);
  });
});

describe('the trips of the account page', () => {
  it('makes the button of the details at least 44px tall', () => {
    expect(css).toMatch(/\.trip__toggle\s*{[^}]*min-height:\s*44px/);
  });

  it('colors each severity with the token of the map, and also writes its name', () => {
    for (const severity of ['leve', 'moderado', 'grave']) {
      expect(css).toMatch(
        new RegExp(
          `\\.trip__severity--${severity} \\.trip__dot\\s*{[^}]*var\\(--severity-${severity}\\)`,
        ),
      );
    }
  });

  it('lets the facts of a trip wrap on a narrow screen', () => {
    expect(css).toMatch(/\.trip__facts\s*{[^}]*repeat\(auto-fit,\s*minmax\(/);
  });

  it('writes the errors with the color of errors of the theme', () => {
    expect(css).toMatch(/\.trip__note--error\s*{[^}]*color:\s*var\(--fail\)/);
  });
});
