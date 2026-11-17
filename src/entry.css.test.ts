// The test reads the real stylesheet (Vitest returns empty text for CSS imports).
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src', 'entry.css'), 'utf8');

describe('the entry stylesheet', () => {
  it('takes every color from the design tokens, so both themes work', () => {
    // A color written by hand would not change with the theme.
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\b(rgb|hsl)a?\(/);
  });

  it('makes the guest button at least 44px tall on phones, for the finger', () => {
    const phone = css.slice(css.indexOf('@media (max-width: 640px)'));
    expect(phone).toMatch(
      /\.button--ghost,\s*\.entry__buttons \.button\s*{[^}]*min-height:\s*44px/,
    );
  });

  it('keeps the hidden Google parts out of the layout', () => {
    expect(css).toMatch(/\.entry__google\[hidden\]\s*{[^}]*display:\s*none/);
    expect(css).toMatch(/\.google-button__slot\[hidden\]\s*{[^}]*display:\s*none/);
  });

  it('splits the screen in two columns, and stacks them on narrow screens', () => {
    expect(css).toMatch(
      /\.entry-page\s*{[^}]*grid-template-columns:\s*minmax\(0, 1\.6fr\) minmax\(0, 1fr\)/,
    );
    const narrow = css.slice(css.indexOf('@media (max-width: 860px)'));
    expect(narrow).toMatch(/\.entry-page\s*{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/);
  });

  it('paints the left panel only with the hero tokens', () => {
    const hero = css.slice(css.indexOf('.entry-hero {'), css.indexOf('.entry-hero__content'));
    expect(hero).toContain('var(--hero-bg)');
    expect(css).toContain('var(--hero-text)');
    expect(css).toContain('var(--hero-muted)');
    expect(css).toContain('var(--hero-main)');
    expect(css).toContain('var(--hero-side)');
  });

  it('colors the links of the right panel with the theme link color, or the brand outside the map', () => {
    expect(css).toMatch(/\.entry__note a\s*{[^}]*color:\s*var\(--route-text, var\(--brand\)\)/);
  });
});
