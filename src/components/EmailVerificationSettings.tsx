import { useEffect, useState } from 'react';
import { getMe, sendVerificationEmail } from '../api/auth';
import { ApiError } from '../api/http';
import type { MessageKey } from '../i18n/translate';
import { useLanguage } from '../i18n/useLanguage';
import type { AccountProfile } from '../types/auth';

type Status =
  | { phase: 'idle' }
  | { phase: 'working' }
  | { phase: 'sent' }
  | { phase: 'failed'; message: MessageKey };

function failureMessage(error: unknown): MessageKey {
  if (!(error instanceof ApiError)) return 'settings.verify.other';
  if (error.kind === 'timeout') return 'authError.timeout.help';
  if (error.kind === 'network') return 'authError.network.help';
  if (error.status === 429) return 'settings.verify.tooMany';
  if (error.status === 502) return 'settings.verify.mailFailed';
  if (error.status === 503) return 'form.recover.unavailable';
  return 'settings.verify.other';
}

/**
 * The "verify your email" group of Settings. It asks who the person is and, when the email is
 * not proven yet, offers to send the link that proves it. An email that is proven (Google does it
 * at every sign-in) shows nothing.
 */
export function EmailVerificationSettings({
  token,
  fetchProfile = getMe,
  send = sendVerificationEmail,
}: {
  token: string;
  fetchProfile?: typeof getMe;
  send?: typeof sendVerificationEmail;
}) {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [status, setStatus] = useState<Status>({ phase: 'idle' });

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile(token, controller.signal)
      .then(setProfile)
      .catch(() => setProfile(null));
    return () => controller.abort();
  }, [token, fetchProfile]);

  if (!profile || profile.emailVerified) return null;

  const ask = async () => {
    if (status.phase === 'working') return;
    setStatus({ phase: 'working' });
    try {
      await send(token);
      setStatus({ phase: 'sent' });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'ALREADY_VERIFIED') {
        // Someone proved it meanwhile (the link on another device): nothing is left to do.
        setProfile({ ...profile, emailVerified: true });
        return;
      }
      setStatus({ phase: 'failed', message: failureMessage(error) });
    }
  };

  return (
    <div className="settings__group">
      <h2 className="account-page__subtitle">{t('settings.verify.title')}</h2>
      <p className="settings__help">{t('settings.verify.help', { email: profile.email })}</p>
      {status.phase === 'sent' && (
        <p className="trip__note" role="status">
          {t('settings.verify.sent', { email: profile.email })}
        </p>
      )}
      {status.phase === 'failed' && (
        <p className="auth-field__error" role="alert">
          {t(status.message)}
        </p>
      )}
      <button
        type="button"
        className="button button--ghost"
        disabled={status.phase === 'working'}
        onClick={() => void ask()}
      >
        {status.phase === 'working'
          ? t('settings.verify.working')
          : status.phase === 'sent'
            ? t('settings.verify.again')
            : t('settings.verify.button')}
      </button>
    </div>
  );
}
