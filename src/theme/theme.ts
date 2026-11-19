export const THEMES = ['auto', 'light', 'dark'] as const;

/** "auto" follows the device; "light" and "dark" are the choice of the person. */
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = 'auto';

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

/**
 * Puts the theme on the page: the stylesheets look at `data-theme` of the root element. With
 * "auto" the attribute is removed, so the theme of the device decides.
 */
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  if (theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}
