import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import type { SignInProgress } from '../lib/session-state';
import { EntryScreen } from './EntryScreen';

vi.mock('./GoogleSignInButton', () => ({
  GoogleSignInButton: ({
    clientId,
    onCredential,
  }: {
    clientId: string;
    onCredential: (credential: string) => void;
  }) => (
    <button type="button" onClick={() => onCredential('google-token')}>
      Google {clientId}
    </button>
  ),
}));

const idle: SignInProgress = { phase: 'idle' };

function renderEntry(overrides: Partial<Parameters<typeof EntryScreen>[0]> = {}) {
  const props = {
    signIn: idle,
    googleClientId: 'client-1',
    onCredential: vi.fn(),
    onGuest: vi.fn(),
    ...overrides,
  };
  render(<EntryScreen {...props} />);
  return props;
}

describe('EntryScreen', () => {
  it('offers the Google button and the guest mode', () => {
    renderEntry();

    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Google client-1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continuar como invitado' })).toBeTruthy();
  });

  it('hands the Google credential to the page', () => {
    const { onCredential } = renderEntry();

    fireEvent.click(screen.getByRole('button', { name: 'Google client-1' }));

    expect(onCredential).toHaveBeenCalledWith('google-token');
  });

  it('goes on as a guest from the button', () => {
    const { onGuest } = renderEntry();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar como invitado' }));

    expect(onGuest).toHaveBeenCalledOnce();
  });

  it('says what is used from the Google account', () => {
    renderEntry();
    expect(screen.getByText(/correo, el nombre y la foto/)).toBeTruthy();
  });

  it('without a client id shows no Google button, says so, and keeps the guest mode', () => {
    renderEntry({ googleClientId: null });

    expect(screen.queryByRole('button', { name: /Google/ })).toBeNull();
    expect(screen.getByText(/no está disponible en esta versión/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continuar como invitado' })).toBeTruthy();
  });

  it('while signing in says so, hides the Google button and blocks the guest button', () => {
    renderEntry({ signIn: { phase: 'working' } });

    expect(screen.getByRole('status').textContent).toBe('Ingresando…');
    expect(
      (screen.getByRole('button', { name: 'Continuar como invitado' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(screen.getByRole('button', { name: 'Google client-1', hidden: true })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Google client-1' })).toBeNull();
  });

  it('explains a failed sign-in and keeps both ways in', () => {
    renderEntry({
      signIn: {
        phase: 'failed',
        error: new ApiError('http', 'x', 429, 'TOO_MANY_REQUESTS', { retryAfterS: 30 }),
      },
    });

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Demasiados intentos de ingreso');
    expect(alert.textContent).toContain('Espera 30 segundos');
    expect(screen.getByRole('button', { name: 'Google client-1' })).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Continuar como invitado' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it('shows no alert when nothing failed', () => {
    renderEntry();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows what the page puts under the buttons', () => {
    renderEntry({ footer: <a href="/privacidad">Privacidad</a> });
    expect(screen.getByRole('link', { name: 'Privacidad' })).toBeTruthy();
  });
});
