import { useCallback, useState } from 'react';
import { applyTheme, type Theme } from './theme';
import { themeStore, type ThemeStore } from './theme-store';

/** The theme of the page and the way to change it: the change is applied and remembered. */
export function useTheme(store: ThemeStore = themeStore): {
  theme: Theme;
  setTheme: (theme: Theme) => void;
} {
  const [theme, setThemeState] = useState<Theme>(() => store.read());

  const setTheme = useCallback(
    (next: Theme) => {
      applyTheme(next);
      store.save(next);
      setThemeState(next);
    },
    [store],
  );

  return { theme, setTheme };
}
