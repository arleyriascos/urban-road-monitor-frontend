import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageProvider';
import type { AuthUser } from '../types/auth';
import { AccountMenu } from './AccountMenu';

const ana: AuthUser = {
  id: 'u1',
  email: 'ana@example.com',
  fullName: 'Ana Pérez',
  avatarUrl: null,
  roles: ['colaborador', 'usuario'],
};

function renderMenu(onSignOut = vi.fn()) {
  render(<AccountMenu user={ana} onSignOut={onSignOut} />);
  return { onSignOut, button: screen.getByRole('button', { name: /Ana Pérez/ }) };
}

beforeEach(() => window.localStorage.clear());

describe('AccountMenu, closed', () => {
  it('shows the name and the role in a button that says it opens a menu', () => {
    const { button } = renderMenu();

    expect(button.textContent).toContain('Colaborador');
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('menu')).toBeNull();
  });
});

describe('AccountMenu, open', () => {
  it('opens with a click, shows who the person is and puts the keyboard on the first item', () => {
    const { button } = renderMenu();

    fireEvent.click(button);

    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('menu', { name: 'Menú de la cuenta' })).toBeTruthy();
    expect(screen.getByText('ana@example.com')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Mi perfil' }));
  });

  it('links each part of the account page and signs out last', () => {
    const { button } = renderMenu();
    fireEvent.click(button);

    const items = screen.getAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Mi perfil',
      'Mis viajes',
      'Configuraciones',
      'Cerrar sesión',
    ]);
    expect(items.slice(0, 3).map((item) => item.getAttribute('href'))).toEqual([
      '/cuenta',
      '/cuenta/viajes',
      '/cuenta/configuraciones',
    ]);
  });

  it('signs out and closes', () => {
    const { button, onSignOut } = renderMenu();
    fireEvent.click(button);

    fireEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }));

    expect(onSignOut).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes when the button is pressed again', () => {
    const { button } = renderMenu();
    fireEvent.click(button);
    fireEvent.click(button);

    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('opens with the arrow down from the button', () => {
    const { button } = renderMenu();

    fireEvent.keyDown(button, { key: 'ArrowDown' });

    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('moves between the items with the arrows, Home and End, going around', () => {
    const { button } = renderMenu();
    fireEvent.click(button);
    const menu = screen.getByRole('menu');
    const [profile, trips, , signOut] = screen.getAllByRole('menuitem') as HTMLElement[];

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(trips);

    fireEvent.keyDown(menu, { key: 'End' });
    expect(document.activeElement).toBe(signOut);

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(profile);

    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(signOut);

    fireEvent.keyDown(menu, { key: 'Home' });
    expect(document.activeElement).toBe(profile);
  });

  it('closes with Escape and gives the keyboard back to the button', () => {
    const { button } = renderMenu();
    fireEvent.click(button);

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });

    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('closes with a click outside, but not with one inside', () => {
    const { button } = renderMenu();
    fireEvent.click(button);

    fireEvent.pointerDown(screen.getByText('ana@example.com'));
    expect(screen.getByRole('menu')).toBeTruthy();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes with the Tab key, so the keyboard does not get lost in a hidden menu', () => {
    const { button } = renderMenu();
    fireEvent.click(button);

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Tab' });

    expect(screen.queryByRole('menu')).toBeNull();
  });
});

describe('AccountMenu in English', () => {
  it('writes the role and the menu in English', () => {
    window.localStorage.setItem('urban-road-monitor.language', 'en');
    render(
      <LanguageProvider>
        <AccountMenu user={ana} onSignOut={vi.fn()} />
      </LanguageProvider>,
    );

    const button = screen.getByRole('button', { name: /Ana Pérez/ });
    expect(button.textContent).toContain('Collaborator');
    fireEvent.click(button);

    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'My profile',
      'My trips',
      'Settings',
      'Sign out',
    ]);
    expect(screen.getByRole('menu', { name: 'Account menu' })).toBeTruthy();
  });
});
