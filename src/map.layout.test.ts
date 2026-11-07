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

  it('leaves at least the height of the bar above a street brought into view', () => {
    const margin = /scroll-margin-top:\s*(\d+)px/.exec(phoneRule('.route-steps__entry'));
    expect(margin, 'scroll-margin-top in px').not.toBeNull();
    expect(Number(margin?.[1])).toBeGreaterThanOrEqual(NAV_HEIGHT_PX);
  });

  it('gives every phone button the 44px touch height the bar is computed from', () => {
    expect(phoneRule('.route-panel button,\n  .route-link')).toContain('min-height: 44px');
  });
});
