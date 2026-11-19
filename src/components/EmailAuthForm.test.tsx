import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageProvider';
import type { AccessView } from '../lib/email-auth';
import { EmailAuthForm } from './EmailAuthForm';

/** The form with its view in a state, as the entry screen holds it. */
function Harness({
  start = 'login',
  onSubmit,
  disabled,
}: {
  start?: AccessView;
  onSubmit?: Parameters<typeof EmailAuthForm>[0]['onSubmit'];
  disabled?: boolean;
}) {
  const [view, setView] = useState<AccessView>(start);
  return (
    <EmailAuthForm view={view} onChangeView={setView} onSubmit={onSubmit} disabled={disabled} />
  );
}

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => {
  window.localStorage.clear();
});

describe('EmailAuthForm to sign in', () => {
  it('has the email, the password, the way to recover it and the way to create an account', () => {
    render(<Harness />);

    expect(screen.getByLabelText('Correo electrónico')).toBeTruthy();
    expect(screen.getByLabelText('Contraseña')).toBeTruthy();
    expect(screen.queryByLabelText('Nombre completo')).toBeNull();
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' })).toBeTruthy();
    expect(screen.getByText('¿Aún no tienes cuenta?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeTruthy();
  });

  it('asks the browser for the saved email and password of the person', () => {
    render(<Harness />);

    const email = screen.getByLabelText('Correo electrónico') as HTMLInputElement;
    expect(email.type).toBe('email');
    expect(email.getAttribute('autocomplete')).toBe('username');
    expect(email.getAttribute('autocapitalize')).toBe('none');
    expect(email.inputMode).toBe('email');
    expect(screen.getByLabelText('Contraseña').getAttribute('autocomplete')).toBe(
      'current-password',
    );
  });

  it('never sends the password in the address, and leaves the messages to the page', () => {
    const { container } = render(<Harness />);

    const form = container.querySelector('form');
    expect(form?.getAttribute('method')).toBe('post');
    expect(form?.getAttribute('action')).toBeNull();
    expect(form?.noValidate).toBe(true);
  });

  it('goes to the other forms from its buttons', () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }));
    expect(screen.getByRole('button', { name: 'Enviar enlace' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Volver a iniciar sesión' }));
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(screen.getByLabelText('Nombre completo')).toBeTruthy();
  });
});

describe('EmailAuthForm to create the account', () => {
  it('asks for the name too, says how long the password must be, and asks for a new password', () => {
    render(<Harness start="register" />);

    expect(screen.getByLabelText('Nombre completo').getAttribute('autocomplete')).toBe('name');
    expect(screen.getByLabelText('Correo electrónico').getAttribute('autocomplete')).toBe('email');
    expect(screen.getByLabelText('Contraseña').getAttribute('autocomplete')).toBe('new-password');
    expect(screen.getByText('Mínimo 8 caracteres.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Crear cuenta', hidden: false })).toBeTruthy();
    expect(screen.getByText('¿Ya tienes cuenta?')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '¿Olvidaste tu contraseña?' })).toBeNull();
  });

  it('goes back to signing in', () => {
    render(<Harness start="register" />);

    fireEvent.click(screen.getByRole('button', { name: 'Inicia sesión' }));

    expect(screen.queryByLabelText('Nombre completo')).toBeNull();
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeTruthy();
  });
});

describe('EmailAuthForm to recover the password', () => {
  it('asks only for the email, and explains what will happen', () => {
    render(<Harness start="recover" />);

    expect(screen.getByLabelText('Correo electrónico')).toBeTruthy();
    expect(screen.queryByLabelText('Contraseña')).toBeNull();
    expect(screen.getByText(/te enviaremos un enlace/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enviar enlace' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Volver a iniciar sesión' })).toBeTruthy();
  });
});

describe('EmailAuthForm when it is sent', () => {
  it('says what is wrong with each empty field, and does not send anything', () => {
    const onSubmit = vi.fn();
    render(<Harness start="register" onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta', hidden: false }));

    const alerts = screen.getAllByRole('alert').map((alert) => alert.textContent);
    expect(alerts).toEqual(['Escribe tu nombre.', 'Escribe tu correo.', 'Escribe tu contraseña.']);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('puts the keyboard on the first field that needs fixing', () => {
    render(<Harness start="register" onSubmit={vi.fn()} />);
    type('Nombre completo', 'Ana');

    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(document.activeElement).toBe(screen.getByLabelText('Correo electrónico'));
  });

  it('refuses a short password only when creating the account', () => {
    const onSubmit = vi.fn();
    const { unmount } = render(<Harness start="register" onSubmit={onSubmit} />);
    type('Nombre completo', 'Ana');
    type('Correo electrónico', 'ana@example.com');
    type('Contraseña', 'abc');
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(screen.getByRole('alert').textContent).toBe('Usa al menos 8 caracteres.');
    expect(onSubmit).not.toHaveBeenCalled();
    unmount();

    render(<Harness start="login" onSubmit={onSubmit} />);
    type('Correo electrónico', 'ana@example.com');
    type('Contraseña', 'abc');
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('clears the error of a field when the person edits it, and only that one', () => {
    render(<Harness onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(screen.getAllByRole('alert')).toHaveLength(2);

    type('Correo electrónico', 'a');

    expect(screen.getAllByRole('alert').map((alert) => alert.textContent)).toEqual([
      'Escribe tu contraseña.',
    ]);
  });

  it('gives the values to the page, with the name and the email trimmed and the password as it is', () => {
    const onSubmit = vi.fn();
    render(<Harness start="register" onSubmit={onSubmit} />);
    type('Nombre completo', '  Ana Pérez ');
    type('Correo electrónico', ' ana@example.com ');
    type('Contraseña', ' secreto 123 ');

    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(onSubmit).toHaveBeenCalledWith('register', {
      name: 'Ana Pérez',
      email: 'ana@example.com',
      password: ' secreto 123 ',
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('sends the email only when recovering, with the password it never asked for empty', () => {
    const onSubmit = vi.fn();
    render(<Harness start="recover" onSubmit={onSubmit} />);
    type('Correo electrónico', 'ana@example.com');

    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }));

    expect(onSubmit).toHaveBeenCalledWith('recover', {
      name: '',
      email: 'ana@example.com',
      password: '',
    });
  });

  it('is sent with the Enter key from a field', () => {
    const onSubmit = vi.fn();
    const { container } = render(<Harness onSubmit={onSubmit} />);
    type('Correo electrónico', 'ana@example.com');
    type('Contraseña', 'x');

    fireEvent.submit(container.querySelector('form')!);

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('cannot be sent while something else is signing the person in', () => {
    render(<Harness disabled />);
    expect(
      (screen.getByRole('button', { name: 'Iniciar sesión' }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});

describe('EmailAuthForm while the way in is not ready', () => {
  it.each([
    ['login', 'El ingreso con correo y contraseña estará disponible pronto'],
    ['register', 'Crear una cuenta con correo y contraseña estará disponible pronto'],
    ['recover', 'Recuperar la contraseña estará disponible pronto'],
  ] as const)('says so in the form to %s, once it is filled right', (view, text) => {
    render(<Harness start={view} />);
    if (view === 'register') type('Nombre completo', 'Ana');
    type('Correo electrónico', 'ana@example.com');
    if (view !== 'recover') type('Contraseña', 'secreto-123');

    expect(screen.queryByRole('status')).toBeNull();
    const submit = { login: 'Iniciar sesión', register: 'Crear cuenta', recover: 'Enviar enlace' };
    const button = screen
      .getAllByRole('button')
      .find(
        (candidate) =>
          candidate.textContent === submit[view] && candidate.getAttribute('type') === 'submit',
      );
    fireEvent.click(button!);

    expect(screen.getByRole('status').textContent).toContain(text);
  });

  it('keeps the email, forgets the password and sends nothing', () => {
    render(<Harness />);
    type('Correo electrónico', 'ana@example.com');
    type('Contraseña', 'secreto-123');

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect((screen.getByLabelText('Correo electrónico') as HTMLInputElement).value).toBe(
      'ana@example.com',
    );
    expect((screen.getByLabelText('Contraseña') as HTMLInputElement).value).toBe('');
  });

  it('does not say it before the form is right', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('takes the notice away when the person goes on typing', () => {
    render(<Harness />);
    type('Correo electrónico', 'ana@example.com');
    type('Contraseña', 'x');
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(screen.getByRole('status')).toBeTruthy();

    type('Contraseña', 'xy');

    expect(screen.queryByRole('status')).toBeNull();
  });
});

describe('EmailAuthForm when the form changes', () => {
  it('starts the new form clean, but keeps the email', () => {
    render(<Harness start="register" onSubmit={vi.fn()} />);
    type('Nombre completo', 'Ana');
    type('Correo electrónico', 'ana@example.com');
    type('Contraseña', 'abc');
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(screen.getByRole('alert')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Inicia sesión' }));

    expect(screen.queryByRole('alert')).toBeNull();
    expect((screen.getByLabelText('Correo electrónico') as HTMLInputElement).value).toBe(
      'ana@example.com',
    );
    expect((screen.getByLabelText('Contraseña') as HTMLInputElement).value).toBe('');

    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect((screen.getByLabelText('Nombre completo') as HTMLInputElement).value).toBe('');
  });
});

describe('EmailAuthForm in English', () => {
  it('writes the labels, the buttons and the errors in English', () => {
    window.localStorage.setItem('urban-road-monitor.language', 'en');
    render(
      <LanguageProvider>
        <Harness start="register" onSubmit={vi.fn()} />
      </LanguageProvider>,
    );

    expect(screen.getByLabelText('Full name')).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByText('At least 8 characters.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getAllByRole('alert').map((alert) => alert.textContent)).toEqual([
      'Enter your name.',
      'Enter your email.',
      'Enter your password.',
    ]);
  });
});
