import { useLanguage } from '../i18n/useLanguage';
import type { AuthUser } from '../types/auth';
import { AccountMenu } from './AccountMenu';

export interface AccountActions {
  /** The signed-in person, or null for a guest. */
  user: AuthUser | null;
  onSignOut: () => void;
  /** A guest goes back to the entry screen to sign in. */
  onSignIn: () => void;
}

/** Who is using the app: the menu of the account, or "Ingresar" for a guest. */
export function AccountBadge({ user, onSignOut, onSignIn }: AccountActions) {
  const { t } = useLanguage();

  if (!user) {
    return (
      <div className="account">
        <button type="button" className="button button--quiet account__button" onClick={onSignIn}>
          {t('account.guest.signIn')}
        </button>
      </div>
    );
  }

  return <AccountMenu user={user} onSignOut={onSignOut} />;
}
