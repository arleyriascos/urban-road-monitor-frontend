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
    expect(phone).toMatch(/\.button--ghost\s*{[^}]*min-height:\s*44px/);
  });

  it('keeps the hidden Google parts out of the layout', () => {
    expect(css).toMatch(/\.entry__google\[hidden\]\s*{[^}]*display:\s*none/);
    expect(css).toMatch(/\.google-button__slot\[hidden\]\s*{[^}]*display:\s*none/);
  });
});
