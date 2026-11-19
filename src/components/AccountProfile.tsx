import { useLanguage } from '../i18n/useLanguage';
import { describeRole, topRole } from '../lib/person';
import type { AuthUser } from '../types/auth';
import { Avatar } from './Avatar';

/** Who the person is: photo, name, email and role, and what the role lets them do. */
export function AccountProfile({ user }: { user: AuthUser }) {
  const { t, locale } = useLanguage();
  const role = topRole(user.roles);

  return (
    <section className="account-page__section" aria-labelledby="account-profile-heading">
      <h1 id="account-profile-heading" className="account-page__title">
        {t('account.profile.heading')}
      </h1>
      <div className="account-profile">
        <Avatar user={user} size={88} />
        <dl className="account-profile__fields">
          <div>
            <dt>{t('account.profile.name')}</dt>
            <dd>{user.fullName}</dd>
          </div>
          <div>
            <dt>{t('account.profile.email')}</dt>
            <dd className="account-profile__email">{user.email}</dd>
          </div>
          <div>
            <dt>{t('account.profile.role')}</dt>
            <dd>{describeRole(user.roles, locale)}</dd>
          </div>
        </dl>
      </div>
      <h2 className="account-page__subtitle">{t('account.profile.canDo')}</h2>
      <p>{t(role ? `account.profile.role.${role}` : 'account.profile.role.other')}</p>
    </section>
  );
}
