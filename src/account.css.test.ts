// The test reads the real stylesheet (Vitest returns empty text for CSS imports).
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src', 'account.css'), 'utf8');

describe('the account stylesheet', () => {
  it('takes every color from the design tokens, so both themes work', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\b(rgb|hsl)a?\(/);
  });

  it('cuts a long name with an ellipsis instead of pushing the button away', () => {
    expect(css).toMatch(/\.account__name\s*{[^}]*text-overflow:\s*ellipsis/);
    expect(css).toMatch(/\.account__name\s*{[^}]*max-width:\s*\d+px/);
  });

  it('makes the sign-out button at least 44px tall on phones, for the finger', () => {
    const phone = css.slice(css.indexOf('@media (max-width: 640px)'));
    expect(phone).toMatch(/\.account__button\s*{[^}]*min-height:\s*44px/);
  });
});
