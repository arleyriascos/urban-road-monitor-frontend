import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src', 'map.css'), 'utf8');

describe('the controls over the map', () => {
  it('puts the camera button at the bottom right, round and in the color of "Cómo llegar"', () => {
    const fab = css.match(/\.camera-fab\s*{([^}]*)}/)?.[1] ?? '';
    const placed = css.match(/\.camera-fab\s*{\s*bottom:\s*\d+px/)?.[0] ?? '';
    const toggle = css.match(/\.route-toggle\s*{([^}]*)}/)?.[1] ?? '';
    expect(fab).toMatch(/right:\s*16px/);
    expect(placed).not.toBe('');
    expect(toggle).toContain('background: var(--brand)');
  });

  it('keeps the camera button over "Centrar" and the zoom buttons, not on top of them', () => {
    const fab = Number(css.match(/\.camera-fab\s*{[^}]*bottom:\s*(\d+)px/)?.[1]);
    const recenter = Number(css.match(/\.recenter\s*{[^}]*bottom:\s*(\d+)px/)?.[1]);
    expect(fab).toBeGreaterThanOrEqual(recenter + 46 + 8);
  });

  it('stops the legend above the camera button, on a screen and on a phone', () => {
    const rules = [...css.matchAll(/\.legend\s*{[^}]*max-height:\s*calc\(100% - (\d+)px\)/g)];
    expect(rules).toHaveLength(2);
    for (const rule of rules) expect(Number(rule[1])).toBeGreaterThanOrEqual(270);
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

  it('makes "Centrar", the camera and both zoom buttons the same round green button', () => {
    const shared =
      css.match(
        /\.recenter,\s*\.camera-fab,\s*\.leaflet-bar\.leaflet-control-zoom a,[^{]*{([^}]*)}/,
      )?.[1] ?? '';
    expect(shared).toMatch(/border-radius:\s*999px/);
    expect(shared).toContain('background: var(--brand)');
    expect(shared).toMatch(/width:\s*46px/);
    expect(shared).toMatch(/height:\s*46px/);
    expect(css).toMatch(/\.leaflet-bar\.leaflet-control-zoom\s*{[^}]*box-shadow:\s*none/);
  });

  it('counts "Centrar" and the camera from the zoom buttons, so they do not overlap', () => {
    const zoom = (source: string) =>
      Number(source.match(/\.leaflet-control-zoom\s*{[^}]*?bottom:\s*(\d+)px/)?.[1]);
    const phone = css.slice(css.indexOf('@media (max-width: 640px)'));
    const screen = css.slice(0, css.indexOf('@media (max-width: 640px)'));
    for (const [source, size] of [
      [screen, 46],
      [phone, 52],
    ] as const) {
      const recenter = Number(source.match(/\.recenter\s*{\s*bottom:\s*(\d+)px/)?.[1]);
      const fab = Number(source.match(/\.camera-fab\s*{\s*bottom:\s*(\d+)px/)?.[1]);
      // the zoom control is two buttons with a gap between them
      expect(recenter).toBeGreaterThanOrEqual(zoom(source) + 2 * size + 8 + 8);
      expect(fab).toBeGreaterThanOrEqual(recenter + size + 8);
    }
    expect(phone).toContain('width: 52px;\n    height: 52px;');
  });

  it('rotates the title and the three numbers in one place on a phone', () => {
    const phone = css.slice(css.indexOf('@media (max-width: 640px)'));
    expect(phone).toMatch(/animation:\s*topbar-rotate 14s infinite both/);
    for (const delay of ['3.5s', '7s', '10.5s'])
      expect(phone).toContain(`animation-delay: ${delay}`);
    expect(css).toContain('@keyframes topbar-rotate');
  });

  it('shows no movement and keeps the title when the person asks for less motion', () => {
    const reduced = css.slice(
      css.indexOf('@media (prefers-reduced-motion: reduce) and (max-width: 640px)'),
    );
    expect(reduced).toMatch(/animation:\s*none/);
    expect(reduced).toMatch(/\.topbar__brand \.brand__text\s*{\s*opacity:\s*1/);
  });
});
