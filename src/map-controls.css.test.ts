import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src', 'map.css'), 'utf8');

describe('the controls over the map', () => {
  it('puts the camera button at the bottom right, round and in the color of "Cómo llegar"', () => {
    const fab = css.match(/\.camera-fab\s*{([^}]*)}/)?.[1] ?? '';
    const toggle = css.match(/\.route-toggle\s*{([^}]*)}/)?.[1] ?? '';
    expect(fab).toMatch(/right:\s*16px/);
    expect(fab).toMatch(/bottom:\s*\d+px/);
    expect(fab).toMatch(/border-radius:\s*999px/);
    expect(fab).toContain('background: var(--brand)');
    expect(toggle).toContain('background: var(--brand)');
  });

  it('keeps the camera button over "Centrar" and the zoom buttons, not on top of them', () => {
    const fab = Number(css.match(/\.camera-fab\s*{[^}]*bottom:\s*(\d+)px/)?.[1]);
    const recenter = Number(css.match(/\.recenter\s*{[^}]*bottom:\s*(\d+)px/)?.[1]);
    expect(fab).toBeGreaterThanOrEqual(recenter + 42 + 8);
  });

  it('stops the legend above the camera button, on a screen and on a phone', () => {
    const rules = [...css.matchAll(/\.legend\s*{[^}]*max-height:\s*calc\(100% - (\d+)px\)/g)];
    expect(rules).toHaveLength(2);
    for (const rule of rules) expect(Number(rule[1])).toBeGreaterThanOrEqual(250);
  });

  it('has the magnifier in the top bar, folded away while the route panel is open', () => {
    expect(css).toMatch(/\.street-search\s*{[^}]*margin-left:\s*auto/);
    expect(css).toMatch(
      /\.map-app--routing \.street-search__toggle,\s*\.map-app--routing \.street-search__popover\s*{[^}]*display:\s*none/,
    );
  });

  it('opens the search box over the whole width of a phone, under the bar', () => {
    expect(css).toMatch(
      /@media \(max-width: 640px\)\s*{[^@]*\.street-search__popover\s*{[^}]*position:\s*fixed/,
    );
  });
});
