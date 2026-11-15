const TOKEN_KEY = 'urban-road-monitor.session';
const GUEST_KEY = 'urban-road-monitor.guest';

/** What the backend makes: 43 characters of base64url. Anything else is not an identifier. */
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{43}$/;

/**
 * What the browser remembers between visits: the session identifier, or that the person chose
 * to enter as a guest. localStorage can be missing or throw (private windows, blocked site
 * data), so every access is protected: without it the app still works, it just forgets.
 */
export interface SessionStore {
  readToken(): string | null;
  saveToken(token: string): void;
  clearToken(): void;
  isGuest(): boolean;
  saveGuest(): void;
  clearGuest(): void;
}

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function createSessionStore(
  getStorage: () => Storage | null = browserStorage,
): SessionStore {
  function read(key: string): string | null {
    try {
      return getStorage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  function write(key: string, value: string): void {
    try {
      getStorage()?.setItem(key, value);
    } catch {
      // Nothing to do: the choice is only forgotten when the page closes.
    }
  }
  function remove(key: string): void {
    try {
      getStorage()?.removeItem(key);
    } catch {
      // Same: there is nothing better to do.
    }
  }

  return {
    readToken() {
      const value = read(TOKEN_KEY);
      if (value === null) return null;
      if (TOKEN_SHAPE.test(value)) return value;
      remove(TOKEN_KEY); // Something else wrote here: it is not a session.
      return null;
    },
    saveToken: (token) => write(TOKEN_KEY, token),
    clearToken: () => remove(TOKEN_KEY),
    isGuest: () => read(GUEST_KEY) === '1',
    saveGuest: () => write(GUEST_KEY, '1'),
    clearGuest: () => remove(GUEST_KEY),
  };
}

export const sessionStore = createSessionStore();
