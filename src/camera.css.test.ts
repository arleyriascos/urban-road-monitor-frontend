// The test reads the real stylesheets (Vitest returns empty text for CSS imports).
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src', 'camera.css'), 'utf8');
const main = readFileSync(resolve(process.cwd(), 'src', 'main.tsx'), 'utf8');

describe('the camera stylesheet', () => {
  it('is loaded by the app', () => {
    expect(main).toContain("import './camera.css';");
  });

  it('takes every color from the design tokens, so both themes work', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\b(rgb|hsl)a?\(/);
  });

  it('shows the video whole, without cutting the road, and lets the touches pass the boxes', () => {
    expect(css).toMatch(/\.camera__video\s*{[^}]*object-fit:\s*contain/);
    expect(css).toMatch(/\.camera__overlay\s*{[^}]*pointer-events:\s*none/);
  });

  it('makes the buttons at least 44px tall, for the finger', () => {
    expect(css).toMatch(/\.camera__button\s*{[^}]*min-height:\s*44px/);
  });

  it('colors the side of each severity with the severity tokens', () => {
    for (const severity of ['leve', 'moderado', 'grave']) {
      expect(css).toMatch(
        new RegExp(
          `\\.meter__count--${severity},\\s*\\.meter__box--${severity}\\s*{[^}]*var\\(--severity-${severity}\\)`,
        ),
      );
    }
  });

  it('stacks the meters on narrow screens', () => {
    const phone = css.slice(css.indexOf('@media (max-width: 640px)'));
    expect(phone).toMatch(/\.camera__meters\s*{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/);
  });
});
