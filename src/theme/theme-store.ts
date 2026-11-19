import { DEFAULT_THEME, isTheme, type Theme } from './theme';

const THEME_KEY = 'urban-road-monitor.theme';

/**
 * The theme the person chose, kept in the browser between visits. localStorage can be missing or
 * throw (private windows, blocked site data), so every access is protected: without it the app
 * still works, it just goes back to following the device on the next visit.
 */
export interface ThemeStore {
  /** The saved theme, or "auto" when nothing valid is saved. */
  read(): Theme;
  save(theme: Theme): void;
}

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function createThemeStore(getStorage: () => Storage | null = browserStorage): ThemeStore {
  return {
    read() {
      try {
        const storage = getStorage();
        const value = storage?.getItem(THEME_KEY) ?? null;
        if (value === null) return DEFAULT_THEME;
        if (isTheme(value)) return value;
        storage?.removeItem(THEME_KEY); // Something else wrote here: it is not a theme.
        return DEFAULT_THEME;
      } catch {
        return DEFAULT_THEME;
      }
    },
    save(theme) {
      try {
        getStorage()?.setItem(THEME_KEY, theme);
      } catch {
        // Nothing to do: the choice is only forgotten when the page closes.
      }
    },
  };
}

export const themeStore = createThemeStore();
