import { useSession } from '../hooks/useSession';
import { useLanguage } from '../i18n/useLanguage';
import type { AccountSection } from '../lib/account-sections';
import { AccountPage } from './AccountPage';
import { Brand } from './BrandMark';
import { SessionCheckScreen } from './SessionCheckScreen';

/**
 * The account page with its own session: it checks the saved session like the first screen, and
 * if there is none (a guest, or the person just signed out) it says so and points to the start.
 */
export function AccountApp({ section }: { section: AccountSection }) {
  const { t } = useLanguage();
  const session = useSession();
  const { state } = session;

  if (state.status === 'checking') {
    return (
      <SessionCheckScreen
        unreachable={state.unreachable}
        onRetry={session.retryCheck}
        onSkip={session.skipCheck}
      />
    );
  }

  if (state.status !== 'signed_in') {
    return (
      <main className="splash">
        <section className="panel splash__card">
          <div className="splash__brand">
            <Brand href="/" />
          </div>
          <h1 className="account-page__title">{t('account.gate.title')}</h1>
          <p>{t('account.gate.help')}</p>
          <a className="button" href="/">
            {t('account.gate.home')}
          </a>
        </section>
      </main>
    );
  }

  return (
    <AccountPage
      section={section}
      user={state.user}
      token={state.token}
      onSignOut={session.signOut}
    />
  );
}
