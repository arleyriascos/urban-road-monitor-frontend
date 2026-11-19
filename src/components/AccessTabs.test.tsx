import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageProvider';
import type { AccessView } from '../lib/email-auth';
import { AccessTabs } from './AccessTabs';

function renderTabs(view: AccessView = 'login') {
  const onChange = vi.fn();
  render(<AccessTabs view={view} onChange={onChange} />);
  return onChange;
}

const tab = (name: string) => screen.getByRole('tab', { name });

beforeEach(() => {
  window.localStorage.clear();
});

describe('AccessTabs', () => {
  it('is a set of two tabs with a name', () => {
    renderTabs();

    expect(screen.getByRole('tablist', { name: 'Cómo entrar' })).toBeTruthy();
    expect(screen.getAllByRole('tab').map((item) => item.textContent)).toEqual([
      'Iniciar sesión',
      'Crear cuenta',
    ]);
  });

  it('marks the chosen tab, and only that one can be reached with the Tab key', () => {
    renderTabs('register');

    expect(tab('Crear cuenta').getAttribute('aria-selected')).toBe('true');
    expect(tab('Crear cuenta').tabIndex).toBe(0);
    expect(tab('Iniciar sesión').getAttribute('aria-selected')).toBe('false');
    expect(tab('Iniciar sesión').tabIndex).toBe(-1);
  });

  it('points both tabs to the panel they control', () => {
    renderTabs();

    for (const item of screen.getAllByRole('tab')) {
      expect(item.getAttribute('aria-controls')).toBe('entry-panel');
    }
    expect(tab('Iniciar sesión').id).toBe('entry-tab-login');
    expect(tab('Crear cuenta').id).toBe('entry-tab-register');
  });

  it('keeps the first tab chosen while the password is recovered', () => {
    renderTabs('recover');

    expect(tab('Iniciar sesión').getAttribute('aria-selected')).toBe('true');
    expect(tab('Crear cuenta').getAttribute('aria-selected')).toBe('false');
  });

  it('changes the form with a click', () => {
    const onChange = renderTabs();

    fireEvent.click(tab('Crear cuenta'));
    expect(onChange).toHaveBeenLastCalledWith('register');

    fireEvent.click(tab('Iniciar sesión'));
    expect(onChange).toHaveBeenLastCalledWith('login');
  });

  it.each([
    ['login', 'ArrowRight', 'register'],
    ['register', 'ArrowLeft', 'login'],
    ['register', 'ArrowRight', 'login'],
    ['login', 'ArrowLeft', 'register'],
    ['register', 'Home', 'login'],
    ['login', 'End', 'register'],
  ] as const)('from %s, the key %s goes to %s', (view, key, expected) => {
    const onChange = renderTabs(view);
    const from = tab(view === 'login' ? 'Iniciar sesión' : 'Crear cuenta');

    fireEvent.keyDown(from, { key });

    expect(onChange).toHaveBeenCalledWith(expected);
  });

  it('puts the keyboard on the tab it moved to', () => {
    renderTabs('login');

    fireEvent.keyDown(tab('Iniciar sesión'), { key: 'ArrowRight' });

    expect(document.activeElement).toBe(tab('Crear cuenta'));
  });

  it('leaves the other keys alone', () => {
    const onChange = renderTabs();

    for (const key of ['Tab', 'Enter', ' ', 'ArrowDown', 'a']) {
      const notPrevented = fireEvent.keyDown(tab('Iniciar sesión'), { key });
      expect(notPrevented, key).toBe(true);
    }
    expect(onChange).not.toHaveBeenCalled();
  });

  it('is named in English when the app is', () => {
    window.localStorage.setItem('urban-road-monitor.language', 'en');
    render(
      <LanguageProvider>
        <AccessTabs view="login" onChange={vi.fn()} />
      </LanguageProvider>,
    );

    expect(screen.getByRole('tablist', { name: 'Way in' })).toBeTruthy();
    expect(screen.getAllByRole('tab').map((item) => item.textContent)).toEqual([
      'Sign in',
      'Create account',
    ]);
  });
});
