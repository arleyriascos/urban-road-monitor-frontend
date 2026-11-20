import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderInEnglish } from '../test/english';
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

  it('has no link to the camera: it is a button of the map now', () => {
    render(<TopBar stats={statsFixture} />);
    expect(screen.queryByRole('link', { name: 'Detector de baches' })).toBeNull();
  });

  it('shows what it is given for the search, before the account', () => {
    render(<TopBar stats={statsFixture} search={<button type="button">lupa</button>} />);
    expect(screen.getByRole('button', { name: 'lupa' })).toBeTruthy();
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

describe('TopBar in English', () => {
  it('shows the title and the numbers in English', () => {
    renderInEnglish(<TopBar stats={statsFixture} />);
    expect(screen.getByRole('heading', { name: 'Street condition in Pasto' })).toBeTruthy();
    const summary = screen.getByRole('list', { name: 'City summary' });
    expect([...summary.querySelectorAll('li')].map((item) => item.textContent)).toEqual([
      '4,610 roads',
      '774.1 km',
      '54 active potholes',
    ]);
  });
});
