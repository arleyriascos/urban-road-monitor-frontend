import { useState, type ReactNode } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { ACCESS_PANEL_ID, accessTabId } from '../lib/access-ids';
import { describeSignInError } from '../lib/auth-errors';
import type { AccessView } from '../lib/email-auth';
import { formatNumber } from '../lib/format';
import type { SignInProgress } from '../lib/session-state';
import { PASTO_NETWORK } from '../lib/pasto-map-art';
import { AccessTabs } from './AccessTabs';
import { Brand } from './BrandMark';
import { EmailAuthForm } from './EmailAuthForm';
import { GoogleSignInButton } from './GoogleSignInButton';
import { Icon } from './Icon';
import { PastoMapArt } from './PastoMapArt';

interface EntryScreenProps {
  signIn: SignInProgress;
  /** The public client id of the Google sign-in; null when this version has none. */
  googleClientId: string | null;
  onCredential: (credential: string) => void;
  onGuest: () => void;
  /**
   * What to do with an email and a password that passed the checks. Without it the forms say the
   * way in is not ready yet and send nothing.
   */
  onEmailAccess?: Parameters<typeof EmailAuthForm>[0]['onSubmit'];
  /** Extra content under the buttons, such as the link to the privacy page. */
  footer?: ReactNode;
}

/** What each way in allows: a guest sees the map, an account also uses the camera. */
const ABILITIES = [
  { key: 'entry.ability.map', guest: true },
  { key: 'entry.ability.routes', guest: true },
  { key: 'entry.ability.camera', guest: false },
  { key: 'entry.ability.send', guest: false },
] as const;

function Mark({ yes }: { yes: boolean }) {
  const { t } = useLanguage();
  return yes ? (
    <span className="entry-compare__yes">
      <Icon name="check" />
      <span className="visually-hidden">{t('common.yes')}</span>
    </span>
  ) : (
    <span className="entry-compare__no">
      <Icon name="minus" />
      <span className="visually-hidden">{t('common.no')}</span>
    </span>
  );
}

/**
 * The first thing a person without a session sees: the map and the numbers on one side and, on
 * the other, three ways in: an email and a password (to sign in or to create an account), Google,
 * or going on as a guest. In every case they see the same map, so the choice is only about having
 * an account.
 */
export function EntryScreen({
  signIn,
  googleClientId,
  onCredential,
  onGuest,
  onEmailAccess,
  footer,
}: EntryScreenProps) {
  const { t, locale } = useLanguage();
  const [view, setView] = useState<AccessView>('login');
  const working = signIn.phase === 'working';
  const failure = signIn.phase === 'failed' ? describeSignInError(signIn.error) : null;
  const chosenTab = view === 'register' ? 'register' : 'login';

  return (
    <main className="entry-page">
      <section className="entry-hero" aria-labelledby="entry-title">
        <PastoMapArt />
        <div className="entry-hero__top">
          <Brand subtitle="Pasto · Nariño" />
        </div>
        <div className="entry-hero__content">
          <h1 id="entry-title" className="entry-hero__title">
            {t('entry.hero.title')}
          </h1>
          <p className="entry-hero__lead">{t('entry.hero.lead')}</p>
          <div className="entry-hero__meta">
            <dl className="entry-hero__card" aria-label={t('entry.hero.cardLabel')}>
              <div>
                <dt>{t('entry.hero.roads')}</dt>
                <dd>{formatNumber(PASTO_NETWORK.roads, locale)}</dd>
              </div>
              <div>
                <dt>{t('entry.hero.segments')}</dt>
                <dd>{formatNumber(PASTO_NETWORK.segments, locale)}</dd>
              </div>
              <div>
                <dt>{t('entry.hero.kilometers')}</dt>
                <dd>{formatNumber(PASTO_NETWORK.kilometers, locale)}</dd>
              </div>
            </dl>
            <p className="entry-hero__source">{t('entry.hero.source')}</p>
          </div>
        </div>
      </section>

      <section className="entry" aria-busy={working}>
        <div className="entry__inner">
          <p className="entry__eyebrow">{t('entry.eyebrow')}</p>

          <AccessTabs view={view} onChange={setView} />

          <div role="tabpanel" id={ACCESS_PANEL_ID} aria-labelledby={accessTabId(chosenTab)}>
            <h2 className="entry__heading">{t(`entry.heading.${view}`)}</h2>
            <p className="entry__lead">{t(`entry.lead.${view}`)}</p>
            <EmailAuthForm
              view={view}
              onChangeView={setView}
              onSubmit={onEmailAccess}
              disabled={working}
            />
          </div>

          <div className="entry__actions">
            <p className="entry__or" aria-hidden="true">
              {t('entry.otherWays')}
            </p>

            {googleClientId ? (
              <div className="entry__google" hidden={working}>
                <GoogleSignInButton clientId={googleClientId} onCredential={onCredential} />
              </div>
            ) : (
              <p className="entry__note">{t('entry.noGoogle')}</p>
            )}

            {working && (
              <p className="entry__working" role="status">
                {t('entry.working')}
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
              className="button entry__guest"
              disabled={working}
              onClick={onGuest}
            >
              {t('entry.guest')}
            </button>
          </div>

          <table className="entry-compare">
            <caption className="visually-hidden">{t('entry.table.caption')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('entry.table.what')}</th>
                <th scope="col">{t('entry.table.guest')}</th>
                <th scope="col">{t('entry.table.account')}</th>
              </tr>
            </thead>
            <tbody>
              {ABILITIES.map((ability) => (
                <tr key={ability.key}>
                  <th scope="row">{t(ability.key)}</th>
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
              {googleClientId && <p className="entry__note">{t('entry.googleNote')}</p>}
              {footer}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
