// The test reads the real stylesheet (Vitest returns empty text for CSS imports).
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Vitest runs from the project folder.
const css = readFileSync(resolve(process.cwd(), 'src', 'map.css'), 'utf8');

const PHONE_QUERY = '@media (max-width: 640px) {';
/** Height of the fixed Anterior / Siguiente bar: a 44px button and 6px of padding above and below. */
const NAV_HEIGHT_PX = 44 + 6 + 6;
/** The least space to leave between the bar and the street brought into view. */
const MIN_GAP_PX = 8;

/** The CSS inside every phone media query of the stylesheet. */
function phoneCss(): string {
  const blocks: string[] = [];
  let index = 0;
  for (;;) {
    const start = css.indexOf(PHONE_QUERY, index);
    if (start === -1) break;
    const open = start + PHONE_QUERY.length - 1;
    let depth = 0;
    let end = open;
    for (; end < css.length; end++) {
      if (css[end] === '{') depth++;
      if (css[end] === '}' && --depth === 0) break;
    }
    blocks.push(css.slice(open + 1, end));
    index = end + 1;
  }
  return blocks.join('\n');
}

/** A number of pixels of the (not phone) route panel rule, such as its padding or border. */
function panelPixels(property: string): number {
  const start = css.indexOf('\n.route-panel {');
  const body = css.slice(start, css.indexOf('}', start));
  const match = new RegExp(`${property}:\\s*(\\d+)px`).exec(body);
  if (!match) throw new Error(`No ${property} in px on .route-panel`);
  return Number(match[1]);
}

const panelPaddingTop = () => panelPixels('padding');
const panelBorder = () => panelPixels('border');

/** The declarations of a rule written inside the phone media queries. */
function phoneRule(selector: string): string {
  const phone = phoneCss();
  const start = phone.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No phone rule for ${selector}`);
  return phone.slice(start, phone.indexOf('}', start));
}

describe('the phone panel keeps the street picked below the fixed bar', () => {
  it('keeps Anterior and Siguiente fixed at the top of the scrolling panel', () => {
    const nav = phoneRule('.route-steps__nav');
    expect(nav).toContain('position: sticky');
    expect(nav).toContain('top: 0');
  });

  it('scrolls the whole panel as one, with no inner scroll in the street list', () => {
    const list = phoneRule('.route-steps__list');
    expect(list).toContain('max-height: none');
    expect(list).toContain('overflow: visible');
  });

  it('puts the scroll margin on the street button, the element that is scrolled into view', () => {
    // The margin only counts on the element passed to scrollIntoView; on its list item it did nothing.
    expect(phoneRule('.route-steps__item')).toContain('scroll-margin-top');
    expect(phoneCss()).not.toMatch(/\.route-steps__entry\s*\{[^}]*scroll-margin-top/);
  });

  it('leaves room for the bar above a street brought into view, counting the panel padding', () => {
    const margin = /scroll-margin-top:\s*(\d+)px/.exec(phoneRule('.route-steps__item'));
    expect(margin, 'scroll-margin-top in px').not.toBeNull();
    // The bar sticks inside the padding of the panel, so the street must clear both.
    expect(Number(margin?.[1])).toBeGreaterThanOrEqual(
      NAV_HEIGHT_PX + panelPaddingTop() + panelBorder() + MIN_GAP_PX,
    );
  });

  it('gives every phone button the 44px touch height the bar is computed from', () => {
    expect(phoneRule('.route-panel button,\n  .route-link')).toContain('min-height: 44px');
  });
});
