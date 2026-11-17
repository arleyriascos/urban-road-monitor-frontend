import type { ReactNode } from 'react';
import { describeSignInError } from '../lib/auth-errors';
import { formatNumber } from '../lib/format';
import type { SignInProgress } from '../lib/session-state';
import { PASTO_NETWORK } from '../lib/pasto-map-art';
import { Brand } from './BrandMark';
import { GoogleSignInButton } from './GoogleSignInButton';
import { Icon } from './Icon';
import { PastoMapArt } from './PastoMapArt';

interface EntryScreenProps {
  signIn: SignInProgress;
  /** The public client id of the Google sign-in; null when this version has none. */
  googleClientId: string | null;
  onCredential: (credential: string) => void;
  onGuest: () => void;
  /** Extra content under the buttons, such as the link to the privacy page. */
  footer?: ReactNode;
}

/** What each way in allows: a guest sees the map, an account also uses the camera. */
const ABILITIES: { label: string; guest: boolean }[] = [
  { label: 'Ver el mapa de baches', guest: true },
  { label: 'Buscar calles y trazar rutas', guest: true },
  { label: 'Detectar baches con la cámara', guest: false },
  { label: 'Guardar y enviar lo que detecta', guest: false },
];

function Mark({ yes }: { yes: boolean }) {
  return yes ? (
    <span className="entry-compare__yes">
      <Icon name="check" />
      <span className="visually-hidden">Sí</span>
    </span>
  ) : (
    <span className="entry-compare__no">
      <Icon name="minus" />
      <span className="visually-hidden">No</span>
    </span>
  );
}

/**
 * The first thing a person without a session sees: sign in with Google or go on as a guest.
 * In both cases they see the same map, so the choice is only about having an account.
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
    <main className="entry-page">
      <section className="entry-hero" aria-labelledby="entry-title">
        <PastoMapArt />
        <div className="entry-hero__top">
          <Brand subtitle="Pasto · Nariño" />
        </div>
        <div className="entry-hero__content">
          <h1 id="entry-title" className="entry-hero__title">
            Las calles de Pasto, sin sorpresas
          </h1>
          <p className="entry-hero__lead">
            Mira qué calles tienen baches, pide una ruta que los evite y, con tu cuenta, detecta
            baches nuevos con la cámara.
          </p>
          <div className="entry-hero__meta">
            <dl className="entry-hero__card" aria-label="La red vial cargada en la app">
              <div>
                <dt>Vías</dt>
                <dd>{formatNumber(PASTO_NETWORK.roads)}</dd>
              </div>
              <div>
                <dt>Tramos</dt>
                <dd>{formatNumber(PASTO_NETWORK.segments)}</dd>
              </div>
              <div>
                <dt>Kilómetros</dt>
                <dd>{formatNumber(PASTO_NETWORK.kilometers)}</dd>
              </div>
            </dl>
            <p className="entry-hero__source">Calles de OpenStreetMap</p>
          </div>
        </div>
      </section>

      <section className="entry" aria-busy={working}>
        <div className="entry__inner">
          <p className="entry__eyebrow">Proyecto final de Estructuras de Datos</p>
          <h2 className="entry__heading">Entra a la app</h2>
          <p className="entry__lead">Elige cómo quieres entrar. Puedes cambiarlo cuando quieras.</p>

          <div className="entry__actions">
            {googleClientId ? (
              <div className="entry__google" hidden={working}>
                <GoogleSignInButton clientId={googleClientId} onCredential={onCredential} />
              </div>
            ) : (
              <p className="entry__note">
                El ingreso con Google no está disponible en esta versión.
              </p>
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

            {googleClientId && (
              <p className="entry__or" aria-hidden="true">
                o
              </p>
            )}

            <button
              type="button"
              className="button entry__guest"
              disabled={working}
              onClick={onGuest}
            >
              Continuar como invitado
            </button>
          </div>

          <table className="entry-compare">
            <caption className="visually-hidden">
              Qué puedes hacer como invitado y con tu cuenta de Google
            </caption>
            <thead>
              <tr>
                <th scope="col">Qué puedes hacer</th>
                <th scope="col">Invitado</th>
                <th scope="col">Google</th>
              </tr>
            </thead>
            <tbody>
              {ABILITIES.map((ability) => (
                <tr key={ability.label}>
                  <th scope="row">{ability.label}</th>
                  <td>
                    <Mark yes={ability.guest} />
                  </td>
                  <td>
                    <Mark yes />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="entry__secure">
            <Icon name="shield" />
            <div>
              {googleClientId && (
                <p className="entry__note">
                  Solo usamos el correo, el nombre y la foto de tu cuenta de Google.
                </p>
              )}
              {footer}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
