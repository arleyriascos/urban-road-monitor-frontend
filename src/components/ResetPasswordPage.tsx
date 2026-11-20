import { useEffect, useState, type FormEvent } from 'react';
import { resetPassword } from '../api/auth';
import { ApiError } from '../api/http';
import { useLanguage } from '../i18n/useLanguage';
import type { MessageKey } from '../i18n/translate';
import { describePasswordProblem } from '../lib/auth-errors';
import { clearLinkFragment, readLinkToken } from '../lib/email-links';
import { checkPassword, PASSWORD_MIN } from '../lib/email-auth';
import { EmailLinkShell } from './EmailLinkShell';
import { PasswordField } from './PasswordField';

type Status =
  | { phase: 'idle' }
  | { phase: 'working' }
  | { phase: 'done' }
  | { phase: 'invalid' }
  | { phase: 'failed'; message: MessageKey };

/**
 * The page the link of the "choose a new password" message opens. It keeps the token from the
 * part after "#" in memory, takes it out of the address, and asks for the new password. It
 * opens no session: the person signs in afterwards, with the new one.
 */
export function ResetPasswordPage({ reset = resetPassword }: { reset?: typeof resetPassword }) {
  const { t } = useLanguage();
  const [token] = useState(() => readLinkToken(window.location.hash));
  const [password, setPassword] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(token ? { phase: 'idle' } : { phase: 'invalid' });

  useEffect(() => {
    clearLinkFragment();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || status.phase === 'working') return;

    const found = checkPassword(password, 'register');
    if (found) {
      setProblem(t(found.key, found.params));
      document.getElementById('reset-password')?.focus();
      return;
    }

    setProblem(null);
    setStatus({ phase: 'working' });
    try {
      await reset({ token, newPassword: password });
      setPassword('');
      setStatus({ phase: 'done' });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'INVALID_PASSWORD') {
        // The link is not spent by a bad password: the person can type another one.
        setProblem(describePasswordProblem(error.details, t));
        setStatus({ phase: 'idle' });
        document.getElementById('reset-password')?.focus();
      } else if (error instanceof ApiError && error.code === 'INVALID_TOKEN') {
        setStatus({ phase: 'invalid' });
      } else if (error instanceof ApiError && error.kind === 'timeout') {
        setStatus({ phase: 'failed', message: 'authError.timeout.help' });
      } else if (error instanceof ApiError && error.kind === 'network') {
        setStatus({ phase: 'failed', message: 'authError.network.help' });
      } else if (error instanceof ApiError && error.status === 429) {
        setStatus({ phase: 'failed', message: 'emailLink.reset.tooMany' });
      } else if (error instanceof ApiError && error.status === 503) {
        setStatus({ phase: 'failed', message: 'emailLink.reset.unavailable' });
      } else {
        setStatus({ phase: 'failed', message: 'emailLink.reset.other' });
      }
    }
  };

  if (status.phase === 'done') {
    return (
      <EmailLinkShell title={t('emailLink.reset.done.title')}>
        <p role="status">{t('emailLink.reset.done.help')}</p>
        <a className="button" href="/">
          {t('emailLink.reset.done.signIn')}
        </a>
      </EmailLinkShell>
    );
  }

  if (status.phase === 'invalid') {
    return (
      <EmailLinkShell title={t('emailLink.invalid.title')}>
        <p role="alert">{t('emailLink.reset.invalidHelp')}</p>
        <a className="button" href="/">
          {t('emailLink.reset.invalidAction')}
        </a>
      </EmailLinkShell>
    );
  }

  return (
    <EmailLinkShell title={t('emailLink.reset.title')}>
      <p>{t('emailLink.reset.help')}</p>
      <form className="auth-form" method="post" noValidate onSubmit={submit}>
        <PasswordField
          id="reset-password"
          label={t('emailLink.reset.label')}
          name="newPassword"
          autoComplete="new-password"
          value={password}
          hint={t('form.password.hint', { min: PASSWORD_MIN })}
          onChange={(event) => {
            setPassword(event.target.value);
            setProblem(null);
            if (status.phase === 'failed') setStatus({ phase: 'idle' });
          }}
          error={problem}
        />
        {status.phase === 'failed' && (
          <p className="auth-field__error" role="alert">
            {t(status.message)}
          </p>
        )}
        <button
          type="submit"
          className="button auth-form__submit"
          disabled={status.phase === 'working'}
        >
          {status.phase === 'working' ? t('emailLink.reset.working') : t('emailLink.reset.submit')}
        </button>
      </form>
    </EmailLinkShell>
  );
}
