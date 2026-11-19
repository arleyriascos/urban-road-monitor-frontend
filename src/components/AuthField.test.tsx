import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthField } from './AuthField';

function renderField(props: Partial<Parameters<typeof AuthField>[0]> = {}) {
  return render(<AuthField id="email" label="Correo electrónico" icon="mail" {...props} />);
}

describe('AuthField', () => {
  it('ties the label to the input, so a click on the label or a screen reader finds it', () => {
    renderField();

    const input = screen.getByLabelText('Correo electrónico');
    expect(input.tagName).toBe('INPUT');
    expect(input.id).toBe('email');
  });

  it('passes the attributes of the input through', () => {
    renderField({
      type: 'email',
      name: 'email',
      autoComplete: 'email',
      inputMode: 'email',
      placeholder: 'tu@correo.com',
      value: 'ana@example.com',
      onChange: () => {},
    });

    const input = screen.getByLabelText('Correo electrónico') as HTMLInputElement;
    expect(input.type).toBe('email');
    expect(input.getAttribute('autocomplete')).toBe('email');
    expect(input.inputMode).toBe('email');
    expect(input.placeholder).toBe('tu@correo.com');
    expect(input.value).toBe('ana@example.com');
  });

  it('draws its icon as a decoration', () => {
    const { container } = renderField();
    expect(container.querySelector('svg.icon')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('says nothing about errors or hints when there are none', () => {
    renderField();

    const input = screen.getByLabelText('Correo electrónico');
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('marks the input invalid and ties it to the error, which is announced', () => {
    renderField({ error: 'Escribe tu correo.' });

    const input = screen.getByLabelText('Correo electrónico');
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('Escribe tu correo.');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(alert.id);
  });

  it('ties the input to the hint, and to both when there is also an error', () => {
    const { rerender } = renderField({ hint: 'Mínimo 8 caracteres' });
    const input = screen.getByLabelText('Correo electrónico');
    const hint = screen.getByText('Mínimo 8 caracteres');
    expect(input.getAttribute('aria-describedby')).toBe(hint.id);
    expect(input.getAttribute('aria-invalid')).toBeNull();

    rerender(
      <AuthField
        id="email"
        label="Correo electrónico"
        icon="mail"
        hint="Mínimo 8 caracteres"
        error="Muy corta"
      />,
    );
    expect(input.getAttribute('aria-describedby')).toBe(
      `${hint.id} ${screen.getByRole('alert').id}`,
    );
  });

  it('marks the box when there is an error', () => {
    const { container, rerender } = renderField();
    expect(container.querySelector('.auth-field__box--error')).toBeNull();

    rerender(<AuthField id="email" label="Correo electrónico" icon="mail" error="Mal" />);
    expect(container.querySelector('.auth-field__box--error')).not.toBeNull();
  });

  it('shows what goes at the end of the box', () => {
    renderField({ trailing: <button type="button">Ver</button> });
    expect(screen.getByRole('button', { name: 'Ver' })).toBeTruthy();
  });

  it('does not let two fields share the ids of their hints and errors', () => {
    render(
      <>
        <AuthField id="a" label="A" icon="mail" error="Mal A" />
        <AuthField id="b" label="B" icon="user" error="Mal B" />
      </>,
    );

    const [first, second] = screen.getAllByRole('alert');
    expect(first?.id).not.toBe(second?.id);
  });
});
