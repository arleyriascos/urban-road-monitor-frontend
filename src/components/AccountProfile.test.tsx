import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageProvider';
import type { AuthUser } from '../types/auth';
import { AccountProfile } from './AccountProfile';

const ana: AuthUser = {
  id: 'u1',
  email: 'ana@example.com',
  fullName: 'Ana Pérez',
  avatarUrl: null,
  roles: ['usuario'],
};

beforeEach(() => window.localStorage.clear());

describe('AccountProfile', () => {
  it('shows the name, the email and the role of the person', () => {
    render(<AccountProfile user={ana} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Mi perfil' })).toBeTruthy();
    const fields = screen.getByText('Nombre').closest('dl')!;
    expect(within(fields).getByText('Ana Pérez')).toBeTruthy();
    expect(within(fields).getByText('ana@example.com')).toBeTruthy();
    expect(within(fields).getByText('Usuario')).toBeTruthy();
    expect(screen.getByText('AP')).toBeTruthy();
  });

  it.each([
    [['usuario'], 'Ver el mapa, trazar rutas, detectar baches con la cámara y ver tus viajes.'],
    [['colaborador', 'usuario'], 'marcar baches como reparados'],
    [['administrador', 'colaborador', 'usuario'], 'administrar las cuentas'],
    [['moderador'], 'permisos propios'],
    [[], 'permisos propios'],
  ])('says what the role %j lets them do', (roles, text) => {
    render(<AccountProfile user={{ ...ana, roles }} />);

    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
      'Qué puedes hacer con tu rol',
    );
    expect(screen.getByText(new RegExp(text))).toBeTruthy();
  });

  it('shows the photo when there is one', () => {
    const { container } = render(
      <AccountProfile user={{ ...ana, avatarUrl: 'https://lh3.googleusercontent.com/a/x' }} />,
    );
    expect(container.querySelector('img')?.getAttribute('width')).toBe('88');
  });

  it('breaks a long email instead of leaving the screen', () => {
    const email = `${'a'.repeat(60)}@example.com`;
    render(<AccountProfile user={{ ...ana, email }} />);
    expect(screen.getByText(email).className).toContain('account-profile__email');
  });

  it('is written in English when the app is', () => {
    window.localStorage.setItem('urban-road-monitor.language', 'en');
    render(
      <LanguageProvider>
        <AccountProfile user={{ ...ana, roles: ['colaborador'] }} />
      </LanguageProvider>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'My profile' })).toBeTruthy();
    expect(screen.getByText('Collaborator')).toBeTruthy();
    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText(/mark potholes as repaired/)).toBeTruthy();
  });
});
