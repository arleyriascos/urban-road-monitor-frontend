import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import { LanguageProvider } from '../i18n/LanguageProvider';
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

  it('says what a guest and an account can each do', () => {
    renderEntry();

    const table = screen.getByRole('table', {
      name: 'Qué puedes hacer como invitado y con una cuenta',
    });
    const row = (label: string) =>
      [...table.querySelectorAll('tbody tr')]
        .find((tr) => tr.querySelector('th')?.textContent === label)
        ?.querySelectorAll('td');

    for (const label of ['Ver el mapa de baches', 'Buscar calles y trazar rutas']) {
      expect([...(row(label) ?? [])].map((cell) => cell.textContent)).toEqual(['Sí', 'Sí']);
    }
    for (const label of ['Detectar baches con la cámara', 'Guardar y enviar lo que detecta']) {
      expect([...(row(label) ?? [])].map((cell) => cell.textContent)).toEqual(['No', 'Sí']);
    }
  });

  it('shows the headline first and the way in after it, each with its own heading', () => {
    renderEntry();

    const title = screen.getByRole('heading', { level: 1 });
    const way = screen.getByRole('heading', { level: 2 });

    expect(title.textContent).toBe('Las calles de Pasto, sin sorpresas');
    expect(way.textContent).toBe('Inicia sesión');
    // Reading order: the panel with the headline comes before the sign-in.
    expect(title.compareDocumentPosition(way) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows the size of the loaded network, with thousands separators', () => {
    renderEntry();

    const card = screen.getByLabelText('La red vial cargada en la app');
    expect(card.textContent).toContain('4.610');
    expect(card.textContent).toContain('10.134');
    expect(card.textContent).toContain('774');
    expect(screen.getByText('Calles de OpenStreetMap')).toBeTruthy();
  });

  it('hides the drawing of the streets from assistive technology', () => {
    const { container } = render(
      <EntryScreen
        signIn={idle}
        googleClientId="client-1"
        onCredential={vi.fn()}
        onGuest={vi.fn()}
      />,
    );

    const art = container.querySelector('svg.pasto-art');
    expect(art?.getAttribute('aria-hidden')).toBe('true');
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

describe('EntryScreen with an email and a password', () => {
  it('opens on the form to sign in, with its tab chosen', () => {
    renderEntry();

    const tabs = screen.getByRole('tablist', { name: 'Cómo entrar' });
    expect(
      within(tabs).getByRole('tab', { name: 'Iniciar sesión' }).getAttribute('aria-selected'),
    ).toBe('true');
    expect(
      within(tabs).getByRole('tab', { name: 'Crear cuenta' }).getAttribute('aria-selected'),
    ).toBe('false');
    const panel = screen.getByRole('tabpanel', { name: 'Iniciar sesión' });
    expect(within(panel).getByLabelText('Correo electrónico')).toBeTruthy();
    expect(within(panel).getByLabelText('Contraseña')).toBeTruthy();
  });

  it('shows the form to create the account with its tab', () => {
    renderEntry();

    fireEvent.click(screen.getByRole('tab', { name: 'Crear cuenta' }));

    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Crea tu cuenta');
    const panel = screen.getByRole('tabpanel', { name: 'Crear cuenta' });
    expect(within(panel).getByLabelText('Nombre completo')).toBeTruthy();
  });

  it('keeps the first tab chosen while the password is recovered', () => {
    renderEntry();

    fireEvent.click(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }));

    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Recupera tu contraseña');
    expect(screen.getByRole('tab', { name: 'Iniciar sesión' }).getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(screen.queryByLabelText('Contraseña')).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: 'Iniciar sesión' }));
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Inicia sesión');
  });

  it('tells the page the email and the password once they are right', () => {
    const onEmailAccess = vi.fn();
    renderEntry({ onEmailAccess });

    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secreto-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión', hidden: false }));

    expect(onEmailAccess).toHaveBeenCalledWith('login', {
      name: '',
      email: 'ana@example.com',
      password: 'secreto-123',
    });
  });

  it('says the way in is not ready when the page gives nothing to do with them', () => {
    const onCredential = vi.fn();
    const onGuest = vi.fn();
    renderEntry({ onCredential, onGuest });

    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secreto-123' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Iniciar sesión' }).at(-1)!);

    expect(screen.getByRole('status').textContent).toContain('estará disponible pronto');
    expect(onCredential).not.toHaveBeenCalled();
    expect(onGuest).not.toHaveBeenCalled();
  });

  it('blocks the form to send while signing in', () => {
    renderEntry({ signIn: { phase: 'working' } });

    const submit = screen
      .getAllByRole('button')
      .find((button) => button.getAttribute('type') === 'submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });

  it('keeps the form, Google and the guest mode when there is no Google', () => {
    renderEntry({ googleClientId: null });

    expect(screen.getByLabelText('Correo electrónico')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continuar como invitado' })).toBeTruthy();
  });
});

describe('EntryScreen in English', () => {
  beforeEach(() => {
    window.localStorage.setItem('urban-road-monitor.language', 'en');
  });

  function renderEnglish() {
    render(
      <LanguageProvider>
        <EntryScreen
          signIn={idle}
          googleClientId="client-1"
          onCredential={vi.fn()}
          onGuest={vi.fn()}
        />
      </LanguageProvider>,
    );
  }

  it('writes the headline, the way in and the buttons in English', () => {
    renderEnglish();

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'The streets of Pasto, no surprises',
    );
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Sign in');
    expect(screen.getByRole('tab', { name: 'Create account' })).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue as a guest' })).toBeTruthy();
    expect(screen.getByText('Streets from OpenStreetMap')).toBeTruthy();
  });

  it('writes the numbers with commas', () => {
    renderEnglish();

    const card = screen.getByLabelText('The road network loaded in the app');
    expect(card.textContent).toContain('4,610');
    expect(card.textContent).toContain('10,134');
    expect(card.textContent).not.toContain('4.610');
  });

  it('writes what a guest and an account can do in English', () => {
    renderEnglish();

    const table = screen.getByRole('table', {
      name: 'What you can do as a guest and with an account',
    });
    expect(within(table).getByRole('columnheader', { name: 'Account' })).toBeTruthy();
    expect(within(table).getByRole('rowheader', { name: 'See the pothole map' })).toBeTruthy();
  });
});
