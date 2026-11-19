import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageProvider';
import type { Theme } from '../theme/theme';
import type { ThemeStore } from '../theme/theme-store';
import { ThemeChoice } from './ThemeChoice';

afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
  window.localStorage.clear();
});

function fakeStore(initial: Theme = 'auto') {
  const save = vi.fn<(theme: Theme) => void>();
  const store: ThemeStore = { read: () => initial, save };
  return { store, save };
}

describe('ThemeChoice', () => {
  it('offers the three themes in a group with a name, with the saved one chosen', () => {
    render(<ThemeChoice store={fakeStore('dark').store} />);

    expect(screen.getByRole('group', { name: 'Tema' })).toBeTruthy();
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(radios.map((radio) => radio.value)).toEqual(['auto', 'light', 'dark']);
    expect(radios.map((radio) => radio.checked)).toEqual([false, false, true]);
    expect(screen.getByRole('radio', { name: 'Oscuro' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Automático' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Claro' })).toBeTruthy();
  });

  it('applies, remembers and marks the theme at once', () => {
    const { store, save } = fakeStore();
    render(<ThemeChoice store={store} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Oscuro' }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(save).toHaveBeenCalledExactlyOnceWith('dark');
    expect((screen.getByRole('radio', { name: 'Oscuro' }) as HTMLInputElement).checked).toBe(true);

    fireEvent.click(screen.getByRole('radio', { name: 'Automático' }));
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('is written in English when the app is', () => {
    window.localStorage.setItem('urban-road-monitor.language', 'en');
    render(
      <LanguageProvider>
        <ThemeChoice store={fakeStore().store} />
      </LanguageProvider>,
    );

    expect(screen.getByRole('group', { name: 'Theme' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeTruthy();
  });
});
