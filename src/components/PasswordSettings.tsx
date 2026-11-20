import { useEffect, useState } from 'react';
import { getMe } from '../api/auth';
import { useLanguage } from '../i18n/useLanguage';
import { ChangePasswordForm } from './ChangePasswordForm';

/**
 * The "change password" group of Settings. It asks who the person is to learn whether the
 * account has a password of its own (a Google account has none) and shows nothing otherwise.
 */
export function PasswordSettings({
  token,
  fetchProfile = getMe,
}: {
  token: string;
  fetchProfile?: typeof getMe;
}) {
  const { t } = useLanguage();
  const [has, setHas] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile(token, controller.signal)
      .then((profile) => setHas(profile.hasPassword))
      .catch(() => setHas(false));
    return () => controller.abort();
  }, [token, fetchProfile]);

  if (!has) return null;
  return (
    <div className="settings__group">
      <h2 className="account-page__subtitle">{t('settings.password.title')}</h2>
      <p className="settings__help">{t('settings.password.help')}</p>
      <ChangePasswordForm token={token} onNoPassword={() => setHas(false)} />
    </div>
  );
}
