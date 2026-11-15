import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { wakeAiService } from './api/ai-service';
import { ApiError } from './api/http';
import { useSession, type SessionControls } from './hooks/useSession';
import type { SessionState } from './lib/session-state';

vi.mock('./api/ai-service', () => ({ wakeAiService: vi.fn() }));
vi.mock('./hooks/useSession');
vi.mock('./components/MapApp', () => ({
  MapApp: ({
    account,
  }: {
    account: { user: { fullName: string } | null; onSignOut: () => void; onSignIn: () => void };
  }) => (
    <div data-testid="map-app">
      <span>{account.user ? account.user.fullName : 'invitado'}</span>
      <button type="button" onClick={account.onSignOut}>
        salir
      </button>
      <button type="button" onClick={account.onSignIn}>
        entrar
      </button>
    </div>
  ),
}));
vi.mock('./components/GoogleSignInButton', () => ({
  GoogleSignInButton: () => <div data-testid="google-button" />,
}));
vi.mock('./config/env', () => ({ googleClientId: 'client-1' }));

const TOKEN = 'a'.repeat(43);
const user = {
  id: 'u1',
  email: 'ana@example.com',
  fullName: 'Ana',
  avatarUrl: null,
  roles: ['usuario'],
};

function showSession(state: SessionState) {
  const controls: SessionControls = {
    state,
    signInWithCredential: vi.fn(() => Promise.resolve()),
    continueAsGuest: vi.fn(),
    requestSignIn: vi.fn(),
    retryCheck: vi.fn(),
    skipCheck: vi.fn(),
    signOut: vi.fn(),
  };
  vi.mocked(useSession).mockReturnValue(controls);
  return controls;
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('App', () => {
  it('shows the entry when nobody chose yet, and not the map', () => {
    showSession({ status: 'entry', signIn: { phase: 'idle' } });
    render(<App />);

    expect(screen.getByRole('button', { name: 'Continuar como invitado' })).toBeTruthy();
    expect(screen.getByTestId('google-button')).toBeTruthy();
    expect(screen.queryByTestId('map-app')).toBeNull();
  });

  it('goes on as a guest from the entry', () => {
    const controls = showSession({ status: 'entry', signIn: { phase: 'idle' } });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Continuar como invitado' }));

    expect(controls.continueAsGuest).toHaveBeenCalledOnce();
  });

  it('shows the check of the saved session while it is checked', () => {
    showSession({ status: 'checking', token: TOKEN, attempt: 0, unreachable: null });
    render(<App />);

    expect(screen.getByText('Comprobando tu sesión…')).toBeTruthy();
    expect(screen.queryByTestId('map-app')).toBeNull();
  });

  it('lets the person retry or skip while the server does not answer', () => {
    const controls = showSession({
      status: 'checking',
      token: TOKEN,
      attempt: 1,
      unreachable: new ApiError('timeout', 'slow'),
    });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Seguir como invitado por ahora' }));

    expect(controls.retryCheck).toHaveBeenCalledOnce();
    expect(controls.skipCheck).toHaveBeenCalledOnce();
  });

  it.each<[string, SessionState]>([
    ['a guest', { status: 'guest', remembered: true }],
    ['a signed-in person', { status: 'signed_in', token: TOKEN, user }],
  ])('shows the map to %s', (_name, state) => {
    showSession(state);
    render(<App />);

    expect(screen.getByTestId('map-app')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Continuar como invitado' })).toBeNull();
  });

  it('tells the map who is signed in, and a guest is a null person', () => {
    showSession({ status: 'signed_in', token: TOKEN, user });
    const { unmount } = render(<App />);
    expect(screen.getByText('Ana')).toBeTruthy();
    unmount();

    showSession({ status: 'guest', remembered: true });
    render(<App />);
    expect(screen.getByText('invitado')).toBeTruthy();
  });

  it('signs out and goes to the entry from the actions the map was given', () => {
    const controls = showSession({ status: 'signed_in', token: TOKEN, user });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'salir' }));
    fireEvent.click(screen.getByRole('button', { name: 'entrar' }));

    expect(controls.signOut).toHaveBeenCalledOnce();
    expect(controls.requestSignIn).toHaveBeenCalledOnce();
  });

  it('starts waking the AI service once, in any screen, as soon as the app opens', () => {
    showSession({ status: 'entry', signIn: { phase: 'idle' } });
    const { rerender } = render(<App />);
    rerender(<App />);

    expect(wakeAiService).toHaveBeenCalledOnce();
  });
});
