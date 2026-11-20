import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import { LanguageProvider } from '../i18n/LanguageProvider';
import { ChangePasswordForm } from './ChangePasswordForm';

afterEach(() => window.localStorage.clear());

type Change = NonNullable<Parameters<typeof ChangePasswordForm>[0]['change']>;

function setup(change: Change, onNoPassword?: () => void) {
  render(
    <LanguageProvider>
      <ChangePasswordForm token="t" change={change} onNoPassword={onNoPassword} />
    </LanguageProvider>,
  );
}
const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const send = () => fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
const fill = (current = 'la clave de ahora', next = 'una clave nueva larga') => {
  type('Contraseña actual', current);
  type('Contraseña nueva', next);
};

describe('ChangePasswordForm', () => {
  it('sends both passwords with the session and says how many sessions were closed', async () => {
    const change = vi.fn<Change>(() => Promise.resolve({ otherSessionsClosed: 2 }));
    setup(change);
    fill();

    send();

    await screen.findByText(/se cerraron 2 sesiones/);
    expect(change).toHaveBeenCalledWith('t', {
      currentPassword: 'la clave de ahora',
      newPassword: 'una clave nueva larga',
    });
    expect((screen.getByLabelText('Contraseña nueva') as HTMLInputElement).value).toBe('');
  });

  it('speaks in the singular and when there was no other session', async () => {
    const change = vi.fn<Change>().mockResolvedValueOnce({ otherSessionsClosed: 1 });
    setup(change);
    fill();
    send();
    await screen.findByText(/se cerró 1 sesión/);

    change.mockResolvedValueOnce({ otherSessionsClosed: 0 });
    fill();
    send();
    await screen.findByText(/No tenías otras sesiones/);
  });

  it('asks for the current password and for a long enough new one before sending', () => {
    const change = vi.fn<Change>();
    setup(change);

    type('Contraseña nueva', 'corta');
    send();

    expect(screen.getByText('Escribe tu contraseña.')).toBeTruthy();
    expect(screen.getByText('Usa al menos 10 caracteres.')).toBeTruthy();
    expect(change).not.toHaveBeenCalled();
  });

  it('does not accept the same password again', () => {
    const change = vi.fn<Change>();
    setup(change);

    fill('una clave larga', 'una clave larga');
    send();

    expect(screen.getByText('La contraseña nueva debe ser distinta de la actual.')).toBeTruthy();
    expect(change).not.toHaveBeenCalled();
  });

  it('shows a wrong current password next to its field', async () => {
    setup(
      vi.fn<Change>().mockRejectedValue(new ApiError('http', 'x', 403, 'INVALID_CURRENT_PASSWORD')),
    );
    fill();

    send();

    await screen.findByText('La contraseña actual no es correcta.');
    expect(screen.getByLabelText('Contraseña actual').getAttribute('aria-invalid')).toBe('true');
  });

  it('shows the rule a new password breaks, next to its field', async () => {
    setup(
      vi
        .fn<Change>()
        .mockRejectedValue(
          new ApiError('http', 'x', 400, 'INVALID_PASSWORD', { problem: 'too_common' }),
        ),
    );
    fill();

    send();

    await screen.findByText('Es una contraseña muy común: elige otra.');
  });

  it('tells the group to go away when the account turns out to have no password', async () => {
    const onNoPassword = vi.fn();
    setup(
      vi.fn<Change>().mockRejectedValue(new ApiError('http', 'x', 409, 'NO_PASSWORD_SET')),
      onNoPassword,
    );
    fill();

    send();

    await waitFor(() => expect(onNoPassword).toHaveBeenCalled());
  });

  it.each([
    [new ApiError('timeout', 'x'), 'despertando'],
    [new ApiError('network', 'x'), 'Revisa tu conexión'],
    [new ApiError('http', 'x', 429), 'Demasiados intentos'],
    [new ApiError('http', 'x', 503), 'despertando'],
    [new ApiError('http', 'x', 500), 'No se pudo cambiar la contraseña'],
  ])('explains a failure that is not about the passwords (%#)', async (error, text) => {
    setup(vi.fn<Change>().mockRejectedValue(error));
    fill();

    send();

    expect((await screen.findByRole('alert')).textContent).toContain(text);
  });

  it('does not send twice while it is working', async () => {
    let finish: (value: { otherSessionsClosed: number }) => void = () => undefined;
    const change = vi.fn<Change>(() => new Promise((resolve) => (finish = resolve)));
    setup(change);
    fill();

    send();
    fireEvent.submit(screen.getByRole('button', { name: 'Cambiando…' }).closest('form')!);
    finish({ otherSessionsClosed: 0 });

    await screen.findByText(/No tenías otras sesiones/);
    expect(change).toHaveBeenCalledTimes(1);
  });
});
