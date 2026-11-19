import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { statsFixture } from '../test/fixtures';
import { TopBar } from './TopBar';

describe('TopBar', () => {
  it('shows the title of the app', () => {
    render(<TopBar stats={statsFixture} />);
    expect(screen.getByRole('heading', { name: 'Estado de las calles de Pasto' })).toBeTruthy();
  });

  it('summarizes the roads, the length and the active potholes', () => {
    render(<TopBar stats={statsFixture} />);
    const summary = screen.getByRole('list', { name: 'Resumen de la ciudad' });
    expect([...summary.querySelectorAll('li')].map((item) => item.textContent)).toEqual([
      '4.610 vías',
      '774,1 km',
      '54 baches activos',
    ]);
  });

  it('links to the camera that detects potholes', () => {
    render(<TopBar stats={statsFixture} />);
    expect(screen.getByRole('link', { name: 'Detector de baches' }).getAttribute('href')).toBe(
      '/camara',
    );
  });

  it('shows no account area when it is not given one', () => {
    render(<TopBar stats={statsFixture} />);
    expect(screen.queryByRole('button', { name: 'Ingresar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull();
  });

  it('shows who is signed in and signs out from the bar', () => {
    const onSignOut = vi.fn();
    const user = {
      id: 'u1',
      email: 'ana@example.com',
      fullName: 'Ana Pérez',
      avatarUrl: null,
      roles: ['usuario'],
    };
    render(<TopBar stats={statsFixture} account={{ user, onSignOut, onSignIn: vi.fn() }} />);

    expect(screen.getByText('Ana Pérez')).toBeTruthy();
    expect(screen.getByText('Usuario')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Ana Pérez/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }));

    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('offers "Ingresar" to a guest', () => {
    const onSignIn = vi.fn();
    render(<TopBar stats={statsFixture} account={{ user: null, onSignOut: vi.fn(), onSignIn }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(onSignIn).toHaveBeenCalledOnce();
  });
});
