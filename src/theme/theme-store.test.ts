import { describe, expect, it } from 'vitest';
import { createThemeStore } from './theme-store';

const KEY = 'urban-road-monitor.theme';

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

describe('the theme store', () => {
  it('follows the device when nothing is saved', () => {
    const { storage } = memoryStorage();
    expect(createThemeStore(() => storage).read()).toBe('auto');
  });

  it('gives back the theme that was saved', () => {
    const { storage, data } = memoryStorage();
    const store = createThemeStore(() => storage);

    store.save('dark');
    expect(data.get(KEY)).toBe('dark');
    expect(store.read()).toBe('dark');

    store.save('light');
    expect(store.read()).toBe('light');
  });

  it('ignores and removes a value that is not a theme', () => {
    const { storage, data } = memoryStorage({ [KEY]: 'purple' });

    expect(createThemeStore(() => storage).read()).toBe('auto');
    expect(data.has(KEY)).toBe(false);
  });

  it('works without storage and when the storage fails', () => {
    expect(createThemeStore(() => null).read()).toBe('auto');
    expect(() => createThemeStore(() => null).save('dark')).not.toThrow();

    const broken = createThemeStore(() => {
      throw new Error('blocked');
    });
    expect(broken.read()).toBe('auto');
    expect(() => broken.save('dark')).not.toThrow();
  });
});
