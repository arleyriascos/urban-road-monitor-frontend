import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src', 'motion.css'), 'utf8');
const main = readFileSync(resolve(process.cwd(), 'src', 'main.tsx'), 'utf8');

const BOXES = [
  '.account-menu__popup',
  '.street-search__popover',
  '.street-search__list',
  '.legend__body',
  '.route-panel',
  '.leaflet-popup-content-wrapper',
];

describe('the boxes that open when a button is pressed', () => {
  it('loads its styles', () => {
    expect(main).toContain("import './motion.css';");
  });

  it.each(BOXES)('%s comes in with an animation', (box) => {
    const escaped = box.replace(/\./g, '\\.');
    expect(css).toMatch(new RegExp(`${escaped}[^{]*{[^}]*animation:\\s*box-in`));
  });

  it('keeps every one of them still when the person asks for less motion', () => {
    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    for (const box of BOXES) expect(reduced).toContain(box);
    expect(reduced).toMatch(/animation:\s*none/);
  });

  it('keeps each animation short, so nothing feels slow', () => {
    for (const [, seconds] of css.matchAll(/animation:\s*box-in[\w-]*\s+([\d.]+)s/g))
      expect(Number(seconds)).toBeLessThanOrEqual(0.25);
  });
});
