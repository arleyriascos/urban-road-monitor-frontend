import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageProvider';
import { PRIVACY_CONTACT_EMAIL } from './PrivacyPage';
import { SettingsSection } from './SettingsSection';

afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('lang');
  window.localStorage.clear();
});

describe('SettingsSection', () => {
  it('has a group for the appearance, the language, the privacy and the account', () => {
    render(<SettingsSection />);

    expect(screen.getByRole('heading', { level: 1, name: 'Configuraciones' })).toBeTruthy();
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(['Apariencia', 'Idioma', 'Privacidad', 'Eliminar mi cuenta']);
  });

  it('adds the groups of the email and of the password, before the privacy one, when the account has a password and an email to verify', async () => {
    const user = {
      id: 'u1',
      email: 'ana@example.com',
      fullName: 'Ana',
      avatarUrl: null,
      roles: ['usuario'],
      permissions: [],
      hasPassword: true,
      emailVerified: false,
    };
    // Two groups ask who the person is: every answer needs its own body.
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ user }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    render(<SettingsSection token={'a'.repeat(43)} />);

    await screen.findByLabelText('Contraseña actual');
    await screen.findByRole('heading', { level: 2, name: 'Verificar correo' });
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent),
    ).toEqual([
      'Apariencia',
      'Idioma',
      'Verificar correo',
      'Contraseña',
      'Privacidad',
      'Eliminar mi cuenta',
    ]);
    vi.restoreAllMocks();
  });

  it('lets the person choose the theme', () => {
    render(<SettingsSection />);

    fireEvent.click(screen.getByRole('radio', { name: 'Oscuro' }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(window.localStorage.getItem('urban-road-monitor.theme')).toBe('dark');
  });

  it('changes the language of the whole page at once, and the texts with it', () => {
    render(
      <LanguageProvider>
        <SettingsSection />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeTruthy();
    expect(document.documentElement.lang).toBe('en');
    expect(window.localStorage.getItem('urban-road-monitor.language')).toBe('en');
  });

  it('links the privacy policy', () => {
    render(<SettingsSection />);

    expect(
      screen.getByRole('link', { name: 'Leer la política de privacidad' }).getAttribute('href'),
    ).toBe('/privacidad');
  });

  it('asks to delete the account by email, with a subject that says what it is', () => {
    render(<SettingsSection />);

    const href = screen
      .getByRole('link', { name: 'Solicitar eliminar mi cuenta' })
      .getAttribute('href')!;

    expect(href.startsWith(`mailto:${PRIVACY_CONTACT_EMAIL}?subject=`)).toBe(true);
    expect(decodeURIComponent(href.split('subject=')[1]!)).toBe(
      'Solicitud para eliminar mi cuenta de Urban Road Monitor',
    );
  });

  it('writes the request to delete in English too', () => {
    window.localStorage.setItem('urban-road-monitor.language', 'en');
    render(
      <LanguageProvider>
        <SettingsSection />
      </LanguageProvider>,
    );

    const href = screen
      .getByRole('link', { name: 'Request to delete my account' })
      .getAttribute('href')!;
    expect(decodeURIComponent(href.split('subject=')[1]!)).toBe(
      'Request to delete my Urban Road Monitor account',
    );
  });
});
