import { describe, expect, it } from 'vitest';
import { createLanguageStore } from './language-store';

const KEY = 'urban-road-monitor.language';

/** A small storage in memory, with the same calls as localStorage. */
function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  } as unknown as Storage;
  return { storage, data };
}

describe('the language store', () => {
  it('starts in Spanish when nothing is saved', () => {
    const { storage } = memoryStorage();
    expect(createLanguageStore(() => storage).read()).toBe('es');
  });

  it('gives back the language that was saved', () => {
    const { storage, data } = memoryStorage();
    const store = createLanguageStore(() => storage);

    store.save('en');
    expect(data.get(KEY)).toBe('en');
    expect(store.read()).toBe('en');

    store.save('es');
    expect(store.read()).toBe('es');
  });

  it('reads what an earlier visit saved', () => {
    const { storage } = memoryStorage({ [KEY]: 'en' });
    expect(createLanguageStore(() => storage).read()).toBe('en');
  });

  it('ignores and removes a value that is not a language of the app', () => {
    for (const value of ['fr', 'EN', 'es ', '', 'null', '{"lang":"en"}']) {
      const { storage, data } = memoryStorage({ [KEY]: value });
      expect(createLanguageStore(() => storage).read(), value).toBe('es');
      expect(data.has(KEY), value).toBe(false);
    }
  });

  it('works without storage: it reads the default and forgets what it saves', () => {
    const store = createLanguageStore(() => null);
    expect(store.read()).toBe('es');
    expect(() => store.save('en')).not.toThrow();
    expect(store.read()).toBe('es');
  });

  it('works when the storage throws on every call', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    const store = createLanguageStore(() => broken);
    expect(store.read()).toBe('es');
    expect(() => store.save('en')).not.toThrow();
  });

  it('works when even asking for the storage throws', () => {
    const store = createLanguageStore(() => {
      throw new Error('no storage');
    });
    expect(store.read()).toBe('es');
    expect(() => store.save('en')).not.toThrow();
  });

  it('uses the real localStorage by default', () => {
    window.localStorage.clear();
    const store = createLanguageStore();
    store.save('en');
    expect(window.localStorage.getItem(KEY)).toBe('en');
    expect(createLanguageStore().read()).toBe('en');
    window.localStorage.clear();
  });
});
