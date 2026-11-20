import type { ReactNode } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { ACCOUNT_PATHS, ACCOUNT_SECTIONS, type AccountSection } from '../lib/account-sections';
import type { AuthUser } from '../types/auth';
import { AccountMenu } from './AccountMenu';
import { AccountProfile } from './AccountProfile';
import { SettingsSection } from './SettingsSection';
import { TripsSection } from './TripsSection';
import { Brand } from './BrandMark';
import { Icon } from './Icon';

/** The part of the account that is shown. */
function Section({
  section,
  user,
  token,
}: {
  section: AccountSection;
  user: AuthUser;
  token: string;
}) {
  if (section === 'profile') return <AccountProfile user={user} />;
  if (section === 'trips') return <TripsSection token={token} />;
  return <SettingsSection token={token} />;
}

/**
 * The account page of a signed-in person: the logo, the way back to the map and the menu in the
 * header; the three parts as links under it; and the part chosen.
 */
export function AccountPage({
  section,
  user,
  token,
  onSignOut,
  children,
}: {
  section: AccountSection;
  user: AuthUser;
  /** The session identifier, for what the page asks the server. */
  token: string;
  onSignOut: () => void;
  /** What replaces the part, such as the message after signing out. */
  children?: ReactNode;
}) {
  const { t } = useLanguage();

  return (
    <div className="account-page">
      <header className="account-page__header">
        <Brand href="/" subtitle={t('account.page.title')} />
        <a className="account-page__back" href="/">
          <Icon name="chevronLeft" />
          {t('account.page.back')}
        </a>
        <AccountMenu user={user} onSignOut={onSignOut} />
      </header>
      <nav className="account-page__nav" aria-label={t('account.page.nav')}>
        {ACCOUNT_SECTIONS.map((item) => (
          <a
            key={item}
            className="account-page__tab"
            href={ACCOUNT_PATHS[item]}
            aria-current={item === section ? 'page' : undefined}
          >
            {t(`account.menu.${item}`)}
          </a>
        ))}
      </nav>
      <main className="account-page__main">
        {children ?? <Section section={section} user={user} token={token} />}
      </main>
    </div>
  );
}
