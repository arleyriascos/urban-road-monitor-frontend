import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import { useSession, type SessionControls } from '../hooks/useSession';
import type { SessionState } from '../lib/session-state';
import { AccountApp } from './AccountApp';

vi.mock('../hooks/useSession');

const TOKEN = 'a'.repeat(43);
const user = {
  id: 'u1',
  email: 'ana@example.com',
  fullName: 'Ana Pérez',
  avatarUrl: null,
  roles: ['usuario'],
};

function showSession(state: SessionState) {
  const controls: SessionControls = {
    state,
    signInWithCredential: vi.fn(() => Promise.resolve()),
    signInWithEmail: vi.fn(() => Promise.resolve()),
    continueAsGuest: vi.fn(),
    requestSignIn: vi.fn(),
    retryCheck: vi.fn(),
    skipCheck: vi.fn(),
    signOut: vi.fn(),
  };
  vi.mocked(useSession).mockReturnValue(controls);
  return controls;
}

beforeEach(() => vi.resetAllMocks());

describe('AccountApp', () => {
  it('checks the saved session before showing anything of the account', () => {
    showSession({ status: 'checking', token: TOKEN, attempt: 0, unreachable: null });
    render(<AccountApp section="profile" />);

    expect(screen.getByText('Comprobando tu sesión…')).toBeTruthy();
    expect(screen.queryByText('Ana Pérez')).toBeNull();
  });

  it('keeps the check on screen when the server does not answer', () => {
    showSession({
      status: 'checking',
      token: TOKEN,
      attempt: 1,
      unreachable: new ApiError('timeout', 'slow'),
    });
    render(<AccountApp section="trips" />);

    expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeTruthy();
  });

  it('shows the account of the signed-in person', () => {
    showSession({ status: 'signed_in', token: TOKEN, user });
    render(<AccountApp section="profile" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Mi perfil' })).toBeTruthy();
    expect(screen.getByText('ana@example.com')).toBeTruthy();
  });

  it.each<[string, SessionState]>([
    ['nobody chose', { status: 'entry', signIn: { phase: 'idle' } }],
    ['a guest', { status: 'guest', remembered: true }],
  ])('asks to sign in when %s, with a way to the start', (_name, state) => {
    showSession(state);
    render(<AccountApp section="profile" />);

    expect(screen.getByRole('heading', { name: 'Ingresa para ver tu cuenta' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ir al inicio' }).getAttribute('href')).toBe('/');
    expect(screen.queryByRole('navigation')).toBeNull();
  });
});
