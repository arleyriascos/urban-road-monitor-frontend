import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Theme } from './theme';
import type { ThemeStore } from './theme-store';
import { useTheme } from './useTheme';

afterEach(() => document.documentElement.removeAttribute('data-theme'));

function fakeStore(initial: Theme = 'auto') {
  const save = vi.fn<(theme: Theme) => void>();
  const store: ThemeStore = { read: () => initial, save };
  return { store, save };
}

describe('useTheme', () => {
  it('starts with the saved theme', () => {
    const { result } = renderHook(() => useTheme(fakeStore('dark').store));
    expect(result.current.theme).toBe('dark');
  });

  it('applies, remembers and shows the new theme', () => {
    const { store, save } = fakeStore();
    const { result } = renderHook(() => useTheme(store));

    act(() => result.current.setTheme('dark'));

    expect(result.current.theme).toBe('dark');
    expect(save).toHaveBeenCalledExactlyOnceWith('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    act(() => result.current.setTheme('auto'));
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});
