import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon, type IconName } from './Icon';

const ALL: IconName[] = [
  'camera',
  'check',
  'chevronDown',
  'chevronLeft',
  'chevronRight',
  'close',
  'eye',
  'eyeOff',
  'layers',
  'locate',
  'lock',
  'mail',
  'minus',
  'route',
  'search',
  'shield',
  'swap',
  'user',
];

describe('Icon', () => {
  it.each(ALL)('draws %s as a decoration that screen readers skip', (name) => {
    const { container } = render(<Icon name={name} />);

    const svg = container.querySelector('svg.icon');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg?.querySelector('path, circle, rect')).not.toBeNull();
  });

  it('draws each icon differently', () => {
    const drawings = ALL.map((name) => {
      const { container, unmount } = render(<Icon name={name} />);
      const html = container.innerHTML;
      unmount();
      return html;
    });

    expect(new Set(drawings).size).toBe(ALL.length);
  });

  it('draws the eye with a slash different from the open eye', () => {
    const open = render(<Icon name="eye" />).container.innerHTML;
    const closed = render(<Icon name="eyeOff" />).container.innerHTML;

    expect(closed).not.toBe(open);
    expect(closed).toContain('M3 3l18 18');
  });
});
