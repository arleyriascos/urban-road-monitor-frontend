import { useState, type InputHTMLAttributes } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { AuthField } from './AuthField';
import { Icon } from './Icon';

interface PasswordFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'className' | 'type'
> {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
}

/** A password field with a lock and an eye that shows what was typed, to catch a typing mistake. */
export function PasswordField(props: PasswordFieldProps) {
  const { t } = useLanguage();
  const [shown, setShown] = useState(false);

  return (
    <AuthField
      {...props}
      icon="lock"
      type={shown ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          className="auth-field__toggle"
          aria-label={shown ? t('form.password.hide') : t('form.password.show')}
          aria-pressed={shown}
          onClick={() => setShown((value) => !value)}
        >
          <Icon name={shown ? 'eyeOff' : 'eye'} />
        </button>
      }
    />
  );
}
