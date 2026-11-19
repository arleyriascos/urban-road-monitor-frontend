import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageProvider';
import { PasswordField } from './PasswordField';

function Controlled({ error }: { error?: string }) {
  const [value, setValue] = useState('');
  return (
    <PasswordField
      id="password"
      label="Contraseña"
      autoComplete="current-password"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      error={error}
    />
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('PasswordField', () => {
  it('hides what is typed at first, and asks the browser for the saved password', () => {
    render(<Controlled />);

    const input = screen.getByLabelText('Contraseña') as HTMLInputElement;
    expect(input.type).toBe('password');
    expect(input.getAttribute('autocomplete')).toBe('current-password');
  });

  it('keeps what the person types', () => {
    render(<Controlled />);

    const input = screen.getByLabelText('Contraseña') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'secreto-123' } });

    expect(input.value).toBe('secreto-123');
  });

  it('shows the password with the eye and hides it again, saying which it will do', () => {
    render(<Controlled />);
    const input = screen.getByLabelText('Contraseña') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'secreto-123' } });

    const show = screen.getByRole('button', { name: 'Mostrar contraseña' });
    expect(show.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(show);

    expect(input.type).toBe('text');
    expect(input.value).toBe('secreto-123');
    const hide = screen.getByRole('button', { name: 'Ocultar contraseña' });
    expect(hide.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(hide);

    expect(input.type).toBe('password');
    expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toBeTruthy();
  });

  it('does not send the form when the eye is pressed', () => {
    const { container } = render(
      <form onSubmit={(event) => event.preventDefault()}>
        <Controlled />
      </form>,
    );

    expect(screen.getByRole('button', { name: 'Mostrar contraseña' }).getAttribute('type')).toBe(
      'button',
    );
    expect(container.querySelector('button[type="submit"]')).toBeNull();
  });

  it('shows the error under the field', () => {
    render(<Controlled error="Escribe tu contraseña." />);

    expect(screen.getByRole('alert').textContent).toBe('Escribe tu contraseña.');
    expect(screen.getByLabelText('Contraseña').getAttribute('aria-invalid')).toBe('true');
  });

  it('names the eye in the language of the app', () => {
    window.localStorage.setItem('urban-road-monitor.language', 'en');
    render(
      <LanguageProvider>
        <Controlled />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeTruthy();
  });
});
