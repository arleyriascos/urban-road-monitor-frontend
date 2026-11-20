import { useEffect, useRef, useState } from 'react';
import { verifyEmail } from '../api/auth';
import { ApiError } from '../api/http';
import { useLanguage } from '../i18n/useLanguage';
import { ACCOUNT_PATHS } from '../lib/account-sections';
import { clearLinkFragment, readLinkToken } from '../lib/email-links';
import { EmailLinkShell } from './EmailLinkShell';

type Status =
  | { phase: 'working' }
  | { phase: 'done' }
  | { phase: 'invalid' }
  | {
      phase: 'failed';
      message: 'authError.timeout.help' | 'authError.network.help' | 'emailLink.verify.other';
    };

/**
 * The page the link of the "verify your email" message opens. It reads the token from the part
 * after "#", takes it out of the address at once, and spends it. It needs no session: the link
 * may be opened on another device.
 */
export function VerifyEmailPage({ verify = verifyEmail }: { verify?: typeof verifyEmail }) {
  const { t } = useLanguage();
  // The token is read once, before the address is cleaned.
  const [token] = useState(() => readLinkToken(window.location.hash));
  const [status, setStatus] = useState<Status>(token ? { phase: 'working' } : { phase: 'invalid' });
  // A link is good once: the check that React makes in development must not spend it twice.
  const started = useRef(false);

  const run = async (value: string) => {
    setStatus({ phase: 'working' });
    try {
      await verify(value);
      setStatus({ phase: 'done' });
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'timeout') {
        setStatus({ phase: 'failed', message: 'authError.timeout.help' });
      } else if (error instanceof ApiError && error.kind === 'network') {
        setStatus({ phase: 'failed', message: 'authError.network.help' });
      } else if (error instanceof ApiError && error.status === 400) {
        setStatus({ phase: 'invalid' });
      } else {
        setStatus({ phase: 'failed', message: 'emailLink.verify.other' });
      }
    }
  };

  useEffect(() => {
    clearLinkFragment();
    if (!token || started.current) return;
    started.current = true;
    void run(token);
    // The token never changes and the check runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status.phase === 'working') {
    return (
      <EmailLinkShell title={t('emailLink.verify.title')}>
        <p role="status" aria-live="polite">
          {t('emailLink.verify.working')}
        </p>
      </EmailLinkShell>
    );
  }

  if (status.phase === 'done') {
    return (
      <EmailLinkShell title={t('emailLink.verify.done')}>
        <p role="status">{t('emailLink.verify.doneHelp')}</p>
        <a className="button" href="/">
          {t('emailLink.home')}
        </a>
      </EmailLinkShell>
    );
  }

  if (status.phase === 'invalid') {
    return (
      <EmailLinkShell title={t('emailLink.invalid.title')}>
        <p role="alert">{t('emailLink.verify.invalidHelp')}</p>
        <a className="button" href={ACCOUNT_PATHS.settings}>
          {t('emailLink.verify.settings')}
        </a>
      </EmailLinkShell>
    );
  }

  return (
    <EmailLinkShell title={t('emailLink.verify.title')}>
      <p role="alert">{t(status.message)}</p>
      {token && (
        <button type="button" className="button" onClick={() => void run(token)}>
          {t('emailLink.retry')}
        </button>
      )}
    </EmailLinkShell>
  );
}
