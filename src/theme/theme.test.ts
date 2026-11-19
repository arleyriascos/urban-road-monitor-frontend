import { afterEach, describe, expect, it } from 'vitest';
import { applyTheme, isTheme, THEMES } from './theme';

afterEach(() => document.documentElement.removeAttribute('data-theme'));

describe('isTheme', () => {
  it.each(THEMES)('accepts %s', (theme) => expect(isTheme(theme)).toBe(true));

  it.each(['', 'Dark', 'system', 'light ', null, undefined, 1, {}])('refuses %j', (value) =>
    expect(isTheme(value)).toBe(false),
  );
});

describe('applyTheme', () => {
  it('writes the chosen theme on the page', () => {
    applyTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    applyTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('leaves the device to decide with "auto": the attribute goes away', () => {
    applyTheme('dark');
    applyTheme('auto');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('can work on another element', () => {
    const element = document.createElement('div');
    applyTheme('dark', element);
    expect(element.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});
