import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AccountSection } from '../lib/account-sections';
import type { AuthUser } from '../types/auth';
import { AccountPage } from './AccountPage';

vi.mock('./TripsSection', () => ({
  TripsSection: ({ token }: { token: string }) => <div data-testid="trips">{token}</div>,
}));

const ana: AuthUser = {
  id: 'u1',
  email: 'ana@example.com',
  fullName: 'Ana Pérez',
  avatarUrl: null,
  roles: ['usuario'],
};

const TOKEN = 'a'.repeat(43);

function renderPage(section: AccountSection, onSignOut = vi.fn()) {
  render(<AccountPage section={section} user={ana} token={TOKEN} onSignOut={onSignOut} />);
  return onSignOut;
}

describe('AccountPage', () => {
  it('has the way back to the map and the logo as links to the start', () => {
    renderPage('profile');

    expect(screen.getByRole('link', { name: 'Volver al mapa' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: /Urban Road Monitor/ }).getAttribute('href')).toBe('/');
  });

  it('links the three parts and marks the one that is open', () => {
    renderPage('trips');

    const nav = screen.getByRole('navigation', { name: 'Partes de tu cuenta' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Mi perfil', '/cuenta'],
      ['Mis viajes', '/cuenta/viajes'],
      ['Configuraciones', '/cuenta/configuraciones'],
    ]);
    expect(links.map((link) => link.getAttribute('aria-current'))).toEqual([null, 'page', null]);
  });

  it('shows the profile in the profile part', () => {
    renderPage('profile');
    expect(screen.getByRole('heading', { level: 1, name: 'Mi perfil' })).toBeTruthy();
  });

  it('shows the trips in the trips part, with the session to ask for them', () => {
    renderPage('trips');
    expect(screen.getByTestId('trips').textContent).toBe(TOKEN);
    expect(screen.queryByRole('heading', { name: 'Mi perfil' })).toBeNull();
  });

  it('signs out from the menu of its header', () => {
    const onSignOut = renderPage('profile');

    fireEvent.click(screen.getByRole('button', { name: /Ana Pérez/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }));

    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('shows what it is given instead of a part, such as a message', () => {
    render(
      <AccountPage section="profile" user={ana} token={TOKEN} onSignOut={vi.fn()}>
        <p>Otra cosa</p>
      </AccountPage>,
    );

    expect(screen.getByText('Otra cosa')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Mi perfil' })).toBeNull();
  });
});
