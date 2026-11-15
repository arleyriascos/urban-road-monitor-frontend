import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PastoMapArt } from './PastoMapArt';

describe('PastoMapArt', () => {
  it('is hidden from screen readers, because it is only decoration', () => {
    const { container } = render(<PastoMapArt />);
    const svg = container.querySelector('svg');

    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
    expect(svg?.querySelector('title')).toBeNull();
  });

  it('draws the main streets over the side streets', () => {
    const { container } = render(<PastoMapArt />);
    const classes = [...container.querySelectorAll('path')].map((path) =>
      path.getAttribute('class'),
    );

    expect(classes).toEqual(['pasto-art__side', 'pasto-art__main']);
    for (const path of container.querySelectorAll('path')) {
      expect((path.getAttribute('d') ?? '').length).toBeGreaterThan(1000);
    }
  });
});
