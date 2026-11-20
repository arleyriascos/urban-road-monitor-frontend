import { useState, type FormEvent } from 'react';
import { changePassword } from '../api/auth';
import { ApiError } from '../api/http';
import { describePasswordProblem } from '../lib/auth-errors';
import { useLanguage } from '../i18n/useLanguage';
import { checkPassword, PASSWORD_MIN, type FieldError } from '../lib/email-auth';
import { PasswordField } from './PasswordField';

interface ChangePasswordFormProps {
  token: string;
  /** The backend said the account has no password: the group goes away. */
  onNoPassword?: () => void;
  /** Replaceable in tests. */
  change?: typeof changePassword;
}

type Status =
  | { phase: 'idle' }
  | { phase: 'working' }
  | { phase: 'done'; closed: number }
  | { phase: 'failed'; message: string };

/**
 * Changes the password of an account that has one. It checks the new password before sending,
 * says next to each field what is wrong, and tells how many other sessions were closed.
 */
export function ChangePasswordForm({
  token,
  onNoPassword,
  change = changePassword,
}: ChangePasswordFormProps) {
  const { t } = useLanguage();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [nextError, setNextError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ phase: 'idle' });

  const text = (error: FieldError) => t(error.key, error.params);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status.phase === 'working') return;
    setStatus({ phase: 'idle' });

    const missing = current === '' ? t('form.error.passwordRequired') : null;
    const found = checkPassword(next, 'register');
    const invalid = found
      ? text(found)
      : next === current
        ? t('authError.password.sameAsCurrent')
        : null;
    setCurrentError(missing);
    setNextError(invalid);
    if (missing || invalid) {
      document
        .getElementById(missing ? 'settings-current-password' : 'settings-new-password')
        ?.focus();
      return;
    }

    setStatus({ phase: 'working' });
    try {
      const answer = await change(token, { currentPassword: current, newPassword: next });
      setCurrent('');
      setNext('');
      setStatus({ phase: 'done', closed: answer.otherSessionsClosed });
    } catch (error) {
      const failure = error instanceof ApiError ? error : new ApiError('network', 'Unexpected');
      setStatus({ phase: 'idle' });
      if (failure.code === 'NO_PASSWORD_SET') {
        onNoPassword?.();
      } else if (failure.code === 'INVALID_CURRENT_PASSWORD') {
        setCurrentError(t('settings.password.currentWrong'));
      } else if (failure.code === 'INVALID_PASSWORD') {
        setNextError(describePasswordProblem(failure.details, t));
      } else {
        setStatus({ phase: 'failed', message: failureMessage(failure, t) });
      }
    }
  };

  return (
    <form className="auth-form" method="post" noValidate onSubmit={submit}>
      <PasswordField
        id="settings-current-password"
        label={t('settings.password.current')}
        name="currentPassword"
        autoComplete="current-password"
        value={current}
        onChange={(event) => {
          setCurrent(event.target.value);
          setCurrentError(null);
          setStatus({ phase: 'idle' });
        }}
        error={currentError}
      />
      <PasswordField
        id="settings-new-password"
        label={t('settings.password.new')}
        name="newPassword"
        autoComplete="new-password"
        value={next}
        hint={t('form.password.hint', { min: PASSWORD_MIN })}
        onChange={(event) => {
          setNext(event.target.value);
          setNextError(null);
          setStatus({ phase: 'idle' });
        }}
        error={nextError}
      />

      {status.phase === 'done' && (
        <p className="trip__note" role="status">
          {status.closed === 0
            ? t('settings.password.doneNone')
            : status.closed === 1
              ? t('settings.password.doneOne')
              : t('settings.password.doneMany', { count: status.closed })}
        </p>
      )}
      {status.phase === 'failed' && (
        <p className="auth-field__error" role="alert">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        className="button auth-form__submit"
        disabled={status.phase === 'working'}
      >
        {status.phase === 'working'
          ? t('settings.password.working')
          : t('settings.password.submit')}
      </button>
    </form>
  );
}

function failureMessage(error: ApiError, t: ReturnType<typeof useLanguage>['t']): string {
  if (error.kind === 'timeout') return t('authError.timeout.help');
  if (error.kind === 'network') return t('authError.network.help');
  if (error.status === 429) return t('settings.password.tooMany');
  if (error.status === 503) return t('authError.unavailable.help');
  return t('settings.password.other');
}
