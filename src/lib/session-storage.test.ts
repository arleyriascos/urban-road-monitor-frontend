import { describe, expect, it } from 'vitest';
import { createSessionStore } from './session-storage';

const TOKEN = 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

/** A store over a storage that lives as long as the store does. */
function memoryStore() {
  const storage = memoryStorage();
  return createSessionStore(() => storage);
}

const brokenStorage = (): Storage => {
  const fail = () => {
    throw new DOMException('blocked', 'SecurityError');
  };
  return {
    length: 0,
    clear: fail,
    getItem: fail,
    key: fail,
    removeItem: fail,
    setItem: fail,
  };
};

describe('the session store', () => {
  it('keeps the identifier and forgets it when it is cleared', () => {
    const store = memoryStore();
    expect(store.readToken()).toBeNull();

    store.saveToken(TOKEN);
    expect(store.readToken()).toBe(TOKEN);

    store.clearToken();
    expect(store.readToken()).toBeNull();
  });

  it('shares what it saved with another store over the same storage', () => {
    const storage = memoryStorage();
    createSessionStore(() => storage).saveToken(TOKEN);
    expect(createSessionStore(() => storage).readToken()).toBe(TOKEN);
  });

  it.each(['', 'abc', 'x'.repeat(42), 'x'.repeat(44), `${'x'.repeat(42)}!`, '<script>'])(
    'ignores and removes a value that is not an identifier: %j',
    (junk) => {
      const storage = memoryStorage();
      storage.setItem('urban-road-monitor.session', junk);
      const store = createSessionStore(() => storage);

      expect(store.readToken()).toBeNull();
      expect(storage.getItem('urban-road-monitor.session')).toBeNull();
    },
  );

  it('remembers that the person chose to be a guest, apart from the identifier', () => {
    const store = memoryStore();
    expect(store.isGuest()).toBe(false);

    store.saveGuest();
    expect(store.isGuest()).toBe(true);
    expect(store.readToken()).toBeNull();

    store.clearGuest();
    expect(store.isGuest()).toBe(false);
  });

  it('does not fail when the storage throws: it just remembers nothing', () => {
    const store = createSessionStore(brokenStorage);

    expect(() => store.saveToken(TOKEN)).not.toThrow();
    expect(() => store.clearToken()).not.toThrow();
    expect(() => store.saveGuest()).not.toThrow();
    expect(() => store.clearGuest()).not.toThrow();
    expect(store.readToken()).toBeNull();
    expect(store.isGuest()).toBe(false);
  });

  it('does not fail when there is no storage at all', () => {
    const store = createSessionStore(() => null);

    store.saveToken(TOKEN);
    store.saveGuest();

    expect(store.readToken()).toBeNull();
    expect(store.isGuest()).toBe(false);
  });

  it('does not fail when asking for the storage throws', () => {
    const store = createSessionStore(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    expect(() => store.saveToken(TOKEN)).not.toThrow();
    expect(store.readToken()).toBeNull();
  });
});
