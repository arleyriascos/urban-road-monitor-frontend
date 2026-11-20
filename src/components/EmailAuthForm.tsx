import { useState, type FormEvent } from 'react';
import type { MessageKey } from '../i18n/translate';
import { requestPasswordReset } from '../api/auth';
import { ApiError } from '../api/http';
import { useLanguage } from '../i18n/useLanguage';
import {
  PASSWORD_MIN,
  checkAccess,
  type AccessErrors,
  type AccessValues,
  type AccessView,
} from '../lib/email-auth';
import { AuthField } from './AuthField';
import { PasswordField } from './PasswordField';

interface EmailAuthFormProps {
  view: AccessView;
  onChangeView: (view: AccessView) => void;
  /**
   * Called with the values (the name and the email already trimmed) once they pass the checks.
   * Without it the way in is not ready: the form says so and sends nothing anywhere. Asking for
   * the link to recover the password does not go through it: the form asks by itself.
   */
  onSubmit?: (view: AccessView, values: AccessValues) => void | Promise<void>;
  /** Asks the backend for the link to choose a new password. Replaceable in tests. */
  recover?: typeof requestPasswordReset;
  /** True while something else is signing the person in. */
  disabled?: boolean;
}

const EMPTY: AccessValues = { name: '', email: '', password: '' };
const FIELD_ORDER = ['name', 'email', 'password'] as const;

type RecoverStatus =
  | { phase: 'idle' }
  | { phase: 'working' }
  | { phase: 'sent' }
  | { phase: 'failed'; messageKey: MessageKey };

/** Why the link could not be asked for, as the key of its text. A timeout or a lost network say so. */
function recoverFailure(error: unknown): MessageKey {
  if (!(error instanceof ApiError)) return 'form.recover.other';
  if (error.kind === 'timeout') return 'authError.timeout.help';
  if (error.kind === 'network') return 'authError.network.help';
  if (error.status === 429) return 'form.recover.tooMany';
  if (error.status === 503) return 'form.recover.unavailable';
  return 'form.recover.other';
}

/**
 * The form to sign in with an email and a password, to create the account, or to ask for a
 * link to choose a new password. It checks what was typed before anything leaves the page, says
 * what is wrong next to each field, and puts the keyboard on the first one that needs fixing.
 */
export function EmailAuthForm({
  view,
  onChangeView,
  onSubmit,
  recover = requestPasswordReset,
  disabled,
}: EmailAuthFormProps) {
  const { t } = useLanguage();
  const [values, setValues] = useState<AccessValues>(EMPTY);
  const [errors, setErrors] = useState<AccessErrors>({});
  const [soon, setSoon] = useState(false);
  const [recovery, setRecovery] = useState<RecoverStatus>({ phase: 'idle' });

  // A new form starts clean, but keeps the email: the person usually goes on with the same one.
  const [shownView, setShownView] = useState(view);
  if (shownView !== view) {
    setShownView(view);
    setErrors({});
    setSoon(false);
    setRecovery({ phase: 'idle' });
    setValues((current) => ({ ...current, name: '', password: '' }));
  }

  const change = (field: keyof AccessValues) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
    setSoon(false);
    if (field === 'email') setRecovery({ phase: 'idle' });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSoon(false);

    const found = checkAccess(view, values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      const first = FIELD_ORDER.find((field) => found[field]);
      if (first) document.getElementById(`access-${first}`)?.focus();
      return;
    }
    setErrors({});

    if (view === 'recover') {
      if (recovery.phase === 'working') return;
      setRecovery({ phase: 'working' });
      try {
        await recover(values.email.trim());
        setRecovery({ phase: 'sent' });
      } catch (error) {
        setRecovery({ phase: 'failed', messageKey: recoverFailure(error) });
      }
      return;
    }
    if (!onSubmit) {
      setValues((current) => ({ ...current, password: '' }));
      setSoon(true);
      return;
    }
    await onSubmit(view, {
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
    });
  };

  const message = (field: keyof AccessValues) => {
    const error = errors[field];
    return error ? t(error.key, error.params) : null;
  };

  return (
    // No action and a POST method: if the script ever failed to take over the sending, the
    // password would still not go to the address bar.
    <form className="auth-form" method="post" noValidate onSubmit={submit}>
      {view === 'recover' && <p className="auth-form__help">{t('form.recover.help')}</p>}

      {view === 'register' && (
        <AuthField
          id="access-name"
          label={t('form.name.label')}
          icon="user"
          name="name"
          autoComplete="name"
          value={values.name}
          onChange={(event) => change('name')(event.target.value)}
          error={message('name')}
        />
      )}

      <AuthField
        id="access-email"
        label={t('form.email.label')}
        icon="mail"
        type="email"
        name="email"
        autoComplete={view === 'login' ? 'username' : 'email'}
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        placeholder={t('form.email.placeholder')}
        value={values.email}
        onChange={(event) => change('email')(event.target.value)}
        error={message('email')}
      />

      {view !== 'recover' && (
        <PasswordField
          id="access-password"
          label={t('form.password.label')}
          name="password"
          autoComplete={view === 'login' ? 'current-password' : 'new-password'}
          value={values.password}
          onChange={(event) => change('password')(event.target.value)}
          error={message('password')}
          hint={view === 'register' ? t('form.password.hint', { min: PASSWORD_MIN }) : undefined}
        />
      )}

      {view === 'login' && (
        <button type="button" className="auth-form__link" onClick={() => onChangeView('recover')}>
          {t('form.forgot')}
        </button>
      )}

      {soon && view !== 'recover' && (
        <p className="auth-form__notice" role="status">
          {t(`form.soon.${view}`)}
        </p>
      )}
      {recovery.phase === 'sent' && (
        <p className="auth-form__notice" role="status">
          {t('form.recover.sent')}
        </p>
      )}
      {recovery.phase === 'failed' && (
        <p className="auth-field__error" role="alert">
          {t(recovery.messageKey)}
        </p>
      )}

      <button
        type="submit"
        className="button auth-form__submit"
        disabled={disabled || recovery.phase === 'working'}
      >
        {recovery.phase === 'working' ? t('form.recover.working') : t(`form.submit.${view}`)}
      </button>

      {view === 'recover' ? (
        <p className="auth-form__switch">
          <button type="button" className="auth-form__link" onClick={() => onChangeView('login')}>
            {t('form.back')}
          </button>
        </p>
      ) : (
        <p className="auth-form__switch">
          {view === 'login' ? t('form.switch.registerPrompt') : t('form.switch.loginPrompt')}{' '}
          <button
            type="button"
            className="auth-form__link"
            onClick={() => onChangeView(view === 'login' ? 'register' : 'login')}
          >
            {view === 'login' ? t('form.switch.register') : t('form.switch.login')}
          </button>
        </p>
      )}
    </form>
  );
}
