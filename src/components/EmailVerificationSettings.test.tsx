import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import { LanguageProvider } from '../i18n/LanguageProvider';
import type { AccountProfile } from '../types/auth';
import { EmailVerificationSettings } from './EmailVerificationSettings';

afterEach(() => window.localStorage.clear());

const profile = (emailVerified: boolean): AccountProfile => ({
  id: 'u1',
  email: 'ana@example.com',
  fullName: 'Ana',
  avatarUrl: null,
  roles: ['usuario'],
  permissions: [],
  hasPassword: true,
  emailVerified,
});

type Fetch = NonNullable<Parameters<typeof EmailVerificationSettings>[0]['fetchProfile']>;
type Send = NonNullable<Parameters<typeof EmailVerificationSettings>[0]['send']>;

const show = (fetchProfile: Fetch, send: Send = vi.fn<Send>()) =>
  render(
    <LanguageProvider>
      <EmailVerificationSettings token="t" fetchProfile={fetchProfile} send={send} />
    </LanguageProvider>,
  );

const sendButton = () => screen.findByRole('button', { name: 'Enviar enlace de verificación' });

describe('EmailVerificationSettings', () => {
  it('offers the link when the email is not verified, and says which email it is', async () => {
    show(vi.fn<Fetch>(() => Promise.resolve(profile(false))));

    await screen.findByRole('heading', { level: 2, name: 'Verificar correo' });
    expect(screen.getByText(/Aún no verificas ana@example.com/)).toBeTruthy();
  });

  it.each([
    ['an email that is verified', () => Promise.resolve(profile(true))],
    ['an answer that fails', () => Promise.reject(new ApiError('network', 'x'))],
  ])('shows nothing for %s', async (_name, answer) => {
    const fetchProfile = vi.fn<Fetch>(answer);
    show(fetchProfile);

    await waitFor(() => expect(fetchProfile).toHaveBeenCalled());
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
  });

  it('sends the link with the session and says where it went', async () => {
    const send = vi.fn<Send>(() => Promise.resolve({ sent: true }));
    show(
      vi.fn<Fetch>(() => Promise.resolve(profile(false))),
      send,
    );

    fireEvent.click(await sendButton());

    expect((await screen.findByRole('status')).textContent).toContain(
      'te enviamos el enlace a ana@example.com',
    );
    expect(send.mock.calls[0][0]).toBe('t');
    expect(screen.getByRole('button', { name: 'Enviar otro enlace' })).toBeTruthy();
  });

  it('cannot ask twice while it waits', async () => {
    let finish: (value: { sent: true }) => void = () => {};
    const send = vi.fn<Send>(() => new Promise((resolve) => (finish = resolve)));
    show(
      vi.fn<Fetch>(() => Promise.resolve(profile(false))),
      send,
    );

    fireEvent.click(await sendButton());
    const waiting = screen.getByRole('button', { name: 'Enviando…' }) as HTMLButtonElement;
    expect(waiting.disabled).toBe(true);
    fireEvent.click(waiting);
    finish({ sent: true });

    await screen.findByRole('status');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('goes away when the server says the email is already verified', async () => {
    const send = vi
      .fn<Send>()
      .mockRejectedValue(new ApiError('http', 'x', 409, 'ALREADY_VERIFIED'));
    show(
      vi.fn<Fetch>(() => Promise.resolve(profile(false))),
      send,
    );

    fireEvent.click(await sendButton());

    await waitFor(() => expect(screen.queryByRole('heading', { level: 2 })).toBeNull());
  });

  it.each([
    [new ApiError('http', 'x', 429, 'RATE_LIMITED'), 'Pediste demasiados enlaces'],
    [new ApiError('http', 'x', 502, 'MAIL_FAILED'), 'No pudimos enviar el correo'],
    [new ApiError('http', 'x', 503, 'MAIL_NOT_CONFIGURED'), 'no está disponible por ahora'],
    [new ApiError('timeout', 'x'), 'despertando'],
    [new ApiError('network', 'x'), 'Revisa tu conexión'],
    [new ApiError('http', 'x', 500, 'INTERNAL'), 'No se pudo enviar el enlace'],
    [new Error('raro'), 'No se pudo enviar el enlace'],
  ])('explains why the link could not be sent (%#)', async (failure, text) => {
    show(
      vi.fn<Fetch>(() => Promise.resolve(profile(false))),
      vi.fn<Send>().mockRejectedValue(failure),
    );

    fireEvent.click(await sendButton());

    expect((await screen.findByRole('alert')).textContent).toContain(text);
    expect(screen.getByRole('button', { name: 'Enviar enlace de verificación' })).toBeTruthy();
  });

  it('writes in English for a person who chose it', async () => {
    window.localStorage.setItem('urban-road-monitor.language', 'en');
    show(vi.fn<Fetch>(() => Promise.resolve(profile(false))));

    await screen.findByRole('heading', { level: 2, name: 'Verify email' });
    expect(screen.getByRole('button', { name: 'Send verification link' })).toBeTruthy();
  });
});
