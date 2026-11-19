import type { InputHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  id: string;
  label: string;
  /** The icon at the start of the box. It only decorates: the label says what the field is. */
  icon: IconName;
  /** What is wrong with the value, already in the language of the person. */
  error?: string | null;
  /** A help line under the box, such as the length a password needs. */
  hint?: string;
  /** Something at the end of the box, such as the button that shows a password. */
  trailing?: ReactNode;
}

/**
 * A field of the access forms: its label, a box with an icon and the input, and under it the
 * hint and the error. The input says it is invalid and points to both lines, so a screen reader
 * reads them with the field.
 */
export function AuthField({ id, label, icon, error, hint, trailing, ...input }: AuthFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className="auth-field">
      <label className="auth-field__label" htmlFor={id}>
        {label}
      </label>
      <div className={error ? 'auth-field__box auth-field__box--error' : 'auth-field__box'}>
        <Icon name={icon} />
        <input
          {...input}
          id={id}
          className="auth-field__input"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
        />
        {trailing}
      </div>
      {hint && (
        <p id={hintId} className="auth-field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="auth-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
