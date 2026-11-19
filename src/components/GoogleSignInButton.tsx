import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { loadGoogleIdentity, type GoogleIdApi } from '../lib/google-identity';

interface GoogleSignInButtonProps {
  clientId: string;
  /** Called with Google's ID token when the person finishes in Google's window. */
  onCredential: (credential: string) => void;
  /** Replaceable in the tests. */
  load?: () => Promise<GoogleIdApi>;
}

const prefersDark = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

/**
 * "Continuar con Google": the button is drawn by Google itself (its script is loaded when this
 * appears), so it follows Google's rules for the brand, and in the language of the app. If the
 * script does not load, the person is told and can try again; the guest mode does not depend
 * on it.
 */
export function GoogleSignInButton({
  clientId,
  onCredential,
  load = loadGoogleIdentity,
}: GoogleSignInButtonProps) {
  const { t, locale } = useLanguage();
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [attempt, setAttempt] = useState(0);

  // Google calls the first callback it was given: this one always reads the latest.
  const latestCallback = useRef(onCredential);
  useEffect(() => {
    latestCallback.current = onCredential;
  });

  useEffect(() => {
    let cancelled = false;
    load()
      .then((google) => {
        const parent = container.current;
        if (cancelled || !parent) return;
        google.initialize({
          client_id: clientId,
          callback: (response) => latestCallback.current(response.credential),
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        google.renderButton(parent, {
          type: 'standard',
          theme: prefersDark() ? 'filled_black' : 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          locale,
          // As wide as the column it sits in; Google accepts from 200 to 400 pixels.
          width: Math.round(Math.min(400, Math.max(200, parent.clientWidth || 280))),
        });
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('failed');
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, load, attempt, locale]);

  const retry = () => {
    setStatus('loading');
    setAttempt((value) => value + 1);
  };

  return (
    <div className="google-button">
      <div ref={container} className="google-button__slot" hidden={status !== 'ready'} />
      {status === 'loading' && (
        <p className="google-button__note" role="status">
          {t('google.loading')}
        </p>
      )}
      {status === 'failed' && (
        <div className="google-button__note" role="alert">
          <p>{t('google.failed')}</p>
          <button type="button" className="button button--quiet" onClick={retry}>
            {t('google.retry')}
          </button>
        </div>
      )}
    </div>
  );
}
