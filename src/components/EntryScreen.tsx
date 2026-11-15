import type { ReactNode } from 'react';
import { describeSignInError } from '../lib/auth-errors';
import type { SignInProgress } from '../lib/session-state';
import { GoogleSignInButton } from './GoogleSignInButton';

interface EntryScreenProps {
  signIn: SignInProgress;
  /** The public client id of the Google sign-in; null when this version has none. */
  googleClientId: string | null;
  onCredential: (credential: string) => void;
  onGuest: () => void;
  /** Extra content under the buttons, such as the link to the privacy page. */
  footer?: ReactNode;
}

/**
 * The first thing a person without a session sees: sign in with Google or go on as a guest.
 * In both cases they see the same thing, so the choice is only about having an account.
 */
export function EntryScreen({
  signIn,
  googleClientId,
  onCredential,
  onGuest,
  footer,
}: EntryScreenProps) {
  const working = signIn.phase === 'working';
  const failure = signIn.phase === 'failed' ? describeSignInError(signIn.error) : null;

  return (
    <main className="splash">
      <section className="panel splash__card entry" aria-busy={working}>
        <p className="splash__brand">Urban Road Monitor</p>
        <h1 className="entry__title">Las calles de Pasto, sin sorpresas</h1>
        <p className="entry__lead">
          Mira qué calles tienen baches y pide una ruta que los evite. Con una cuenta de Google o
          como invitado ves lo mismo.
        </p>

        <div className="entry__actions">
          {googleClientId ? (
            <div className="entry__google" hidden={working}>
              <GoogleSignInButton clientId={googleClientId} onCredential={onCredential} />
            </div>
          ) : (
            <p className="entry__note">El ingreso con Google no está disponible en esta versión.</p>
          )}

          {working && (
            <p className="entry__working" role="status">
              Ingresando…
            </p>
          )}

          {failure && (
            <div className="entry__error" role="alert">
              <p className="entry__error-title">{failure.title}</p>
              <p className="entry__error-help">{failure.help}</p>
            </div>
          )}

          <button
            type="button"
            className="button button--ghost"
            disabled={working}
            onClick={onGuest}
          >
            Continuar como invitado
          </button>
        </div>

        {googleClientId && (
          <p className="entry__note">
            Solo usamos el correo, el nombre y la foto de tu cuenta de Google.
          </p>
        )}
        {footer}
      </section>
    </main>
  );
}
