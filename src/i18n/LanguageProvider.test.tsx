import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider } from './LanguageProvider';
import { createLanguageStore, type LanguageStore } from './language-store';
import type { Locale } from './locale';
import { useLanguage } from './useLanguage';

const KEY = 'urban-road-monitor.language';

function Probe() {
  const { locale, setLocale, t } = useLanguage();
  return (
    <div>
      <p data-testid="locale">{locale}</p>
      <p data-testid="label">{t('language.label')}</p>
      <button type="button" onClick={() => setLocale('en')}>
        to-en
      </button>
      <button type="button" onClick={() => setLocale('es')}>
        to-es
      </button>
    </div>
  );
}

/** A store that remembers nothing, to count what the provider asks it to save. */
function recordingStore(initial: Locale): LanguageStore & { saved: Locale[] } {
  const saved: Locale[] = [];
  return {
    saved,
    read: () => initial,
    save: (locale) => void saved.push(locale),
  };
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.lang = '';
});

afterEach(() => {
  window.localStorage.clear();
});

describe('LanguageProvider', () => {
  it('starts in Spanish when nothing is saved, and tells the page', () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );

    expect(screen.getByTestId('locale').textContent).toBe('es');
    expect(screen.getByTestId('label').textContent).toBe('Idioma');
    expect(document.documentElement.lang).toBe('es');
  });

  it('starts in the language saved in an earlier visit', () => {
    window.localStorage.setItem(KEY, 'en');
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );

    expect(screen.getByTestId('locale').textContent).toBe('en');
    expect(screen.getByTestId('label').textContent).toBe('Language');
    expect(document.documentElement.lang).toBe('en');
  });

  it('changes the texts, the page language and the saved choice together', () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );

    act(() => screen.getByRole('button', { name: 'to-en' }).click());
    expect(screen.getByTestId('label').textContent).toBe('Language');
    expect(document.documentElement.lang).toBe('en');
    expect(window.localStorage.getItem(KEY)).toBe('en');

    act(() => screen.getByRole('button', { name: 'to-es' }).click());
    expect(screen.getByTestId('label').textContent).toBe('Idioma');
    expect(document.documentElement.lang).toBe('es');
    expect(window.localStorage.getItem(KEY)).toBe('es');
  });

  it('keeps the choice for the next visit', () => {
    const first = render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    act(() => screen.getByRole('button', { name: 'to-en' }).click());
    first.unmount();

    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('locale').textContent).toBe('en');
  });

  it('ignores a language the app does not have', () => {
    const store = recordingStore('es');
    const { result } = renderHook(() => useLanguage(), {
      wrapper: ({ children }) => <LanguageProvider store={store}>{children}</LanguageProvider>,
    });

    act(() => result.current.setLocale('fr' as Locale));

    expect(result.current.locale).toBe('es');
    expect(store.saved).toEqual([]);
  });

  it('still changes the language while the page is open when the browser cannot save it', () => {
    const broken = createLanguageStore(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() => useLanguage(), {
      wrapper: ({ children }) => <LanguageProvider store={broken}>{children}</LanguageProvider>,
    });

    act(() => result.current.setLocale('en'));

    expect(result.current.locale).toBe('en');
    expect(result.current.t('language.label')).toBe('Language');
  });

  it('gives the same function and value while the language does not change', () => {
    const { result, rerender } = renderHook(() => useLanguage(), {
      wrapper: ({ children }) => <LanguageProvider>{children}</LanguageProvider>,
    });
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it('fills the placeholders of a text with the parameters it is given', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: ({ children }) => <LanguageProvider>{children}</LanguageProvider>,
    });

    expect(result.current.t('language.label', { unused: 1 })).toBe('Idioma');
  });
});

describe('useLanguage without a provider', () => {
  it('gives Spanish and a language that cannot be changed, instead of failing', () => {
    const { result } = renderHook(() => useLanguage());

    expect(result.current.locale).toBe('es');
    expect(result.current.t('language.label')).toBe('Idioma');
    expect(() => result.current.setLocale('en')).not.toThrow();
    expect(result.current.locale).toBe('es');
  });
});
