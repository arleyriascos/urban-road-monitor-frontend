import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import { renderInEnglish } from '../test/english';
import { ResetPasswordPage } from './ResetPasswordPage';

const TOKEN = 'Ab3_-'.repeat(8) + 'xyz';

function openLink(hash = `#token=${TOKEN}`) {
  window.history.replaceState(null, '', `/restablecer${hash}`);
}

const type = (value: string) =>
  fireEvent.change(screen.getByLabelText('Contraseña nueva'), { target: { value } });
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

beforeEach(() => {
  window.localStorage.clear();
  openLink();
});

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('ResetPasswordPage', () => {
  it('takes the token out of the address at once and asks for the new password', () => {
    render(<ResetPasswordPage reset={vi.fn()} />);

    expect(window.location.hash).toBe('');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Elige una contraseña nueva',
    );
    const field = screen.getByLabelText('Contraseña nueva') as HTMLInputElement;
    expect(field.getAttribute('autocomplete')).toBe('new-password');
    expect(screen.getByText('Mínimo 10 caracteres.')).toBeTruthy();
  });

  it('sends the token and the new password, and then points to signing in', async () => {
    const reset = vi.fn(async () => ({ reset: true as const }));
    render(<ResetPasswordPage reset={reset} />);
    type('una clave nueva larga');

    save();

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
        'Listo: cambiaste tu contraseña',
      ),
    );
    expect(reset).toHaveBeenCalledWith({ token: TOKEN, newPassword: 'una clave nueva larga' });
    expect(screen.getByRole('link', { name: 'Iniciar sesión' }).getAttribute('href')).toBe('/');
  });

  it('checks the length first and sends nothing when the password is short', () => {
    const reset = vi.fn();
    render(<ResetPasswordPage reset={reset} />);
    type('corta');

    save();

    expect(screen.getByRole('alert').textContent).toContain('al menos 10');
    expect(reset).not.toHaveBeenCalled();
  });

  it('says what rule the server found broken, and lets the person type another one', async () => {
    const reset = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError('http', 'x', 400, 'INVALID_PASSWORD', { problem: 'too_common' }),
      )
      .mockResolvedValueOnce({ reset: true });
    render(<ResetPasswordPage reset={reset} />);
    type('1234567890');

    save();

    expect((await screen.findByRole('alert')).textContent).toContain('común');
    type('una clave nueva larga');
    save();

    await waitFor(() => expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeTruthy());
    expect(reset).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['there is no token', ''],
    ['the token has the wrong shape', '#token=corto'],
  ])('says the link does not work when %s', (_name, hash) => {
    openLink(hash);
    const reset = vi.fn();
    render(<ResetPasswordPage reset={reset} />);

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Este enlace ya no sirve');
    expect(screen.getByRole('link', { name: 'Pedir un enlace nuevo' }).getAttribute('href')).toBe(
      '/',
    );
    expect(screen.queryByLabelText('Contraseña nueva')).toBeNull();
    expect(reset).not.toHaveBeenCalled();
  });

  it('says the link does not work when the server refuses it', async () => {
    render(
      <ResetPasswordPage
        reset={vi.fn().mockRejectedValue(new ApiError('http', 'x', 400, 'INVALID_TOKEN'))}
      />,
    );
    type('una clave nueva larga');

    save();

    expect((await screen.findByRole('alert')).textContent).toContain('venció');
    expect(screen.queryByLabelText('Contraseña nueva')).toBeNull();
  });

  it.each([
    [new ApiError('timeout', 'x'), 'despertando'],
    [new ApiError('network', 'x'), 'Revisa tu conexión'],
    [new ApiError('http', 'x', 429, 'RATE_LIMITED'), 'Demasiados intentos'],
    [new ApiError('http', 'x', 503, 'MAIL_NOT_CONFIGURED'), 'Intenta más tarde'],
    [new ApiError('http', 'x', 500, 'INTERNAL'), 'No se pudo guardar'],
  ])('keeps the form and explains a failure of the server (%#)', async (failure, text) => {
    render(<ResetPasswordPage reset={vi.fn().mockRejectedValue(failure)} />);
    type('una clave nueva larga');

    save();

    expect((await screen.findByRole('alert')).textContent).toContain(text);
    expect((screen.getByLabelText('Contraseña nueva') as HTMLInputElement).value).toBe(
      'una clave nueva larga',
    );
  });

  it('cannot be sent twice while it waits', async () => {
    let finish: (value: { reset: true }) => void = () => {};
    const reset = vi.fn(() => new Promise<{ reset: true }>((resolve) => (finish = resolve)));
    render(<ResetPasswordPage reset={reset} />);
    type('una clave nueva larga');

    save();
    const waiting = screen.getByRole('button', { name: 'Guardando…' }) as HTMLButtonElement;
    expect(waiting.disabled).toBe(true);
    fireEvent.submit(waiting.closest('form')!);
    finish({ reset: true });

    await screen.findByRole('link', { name: 'Iniciar sesión' });
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('writes in English for a person who chose it', () => {
    window.localStorage.setItem('urban-road-monitor.language', 'en');
    renderInEnglish(<ResetPasswordPage reset={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Choose a new password');
    expect(screen.getByRole('button', { name: 'Save password' })).toBeTruthy();
  });
});
