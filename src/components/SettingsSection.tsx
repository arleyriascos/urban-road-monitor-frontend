import { useLanguage } from '../i18n/useLanguage';
import { LanguageSwitch } from '../i18n/LanguageSwitch';
import type { ThemeStore } from '../theme/theme-store';
import { PRIVACY_CONTACT_EMAIL, PRIVACY_PATH } from './PrivacyPage';
import { PasswordSettings } from './PasswordSettings';
import { ThemeChoice } from './ThemeChoice';

/** "Configuraciones": the theme, the language, the privacy policy and how to ask to delete the account. */
export function SettingsSection({
  themeStore,
  token,
}: {
  themeStore?: ThemeStore;
  /** The session: with it, an account that has a password can change it here. */
  token?: string;
}) {
  const { t } = useLanguage();
  const subject = encodeURIComponent(t('settings.delete.subject'));

  return (
    <section className="account-page__section" aria-labelledby="account-settings-heading">
      <h1 id="account-settings-heading" className="account-page__title">
        {t('settings.heading')}
      </h1>

      <div className="settings__group">
        <h2 className="account-page__subtitle">{t('settings.appearance.title')}</h2>
        <p className="settings__help">{t('settings.appearance.help')}</p>
        <ThemeChoice store={themeStore} />
      </div>

      <div className="settings__group">
        <h2 className="account-page__subtitle">{t('settings.language.title')}</h2>
        <p className="settings__help">{t('settings.language.help')}</p>
        <LanguageSwitch />
      </div>

      {token && <PasswordSettings token={token} />}

      <div className="settings__group">
        <h2 className="account-page__subtitle">{t('settings.privacy.title')}</h2>
        <p className="settings__help">{t('settings.privacy.help')}</p>
        <a className="settings__link" href={PRIVACY_PATH}>
          {t('settings.privacy.link')}
        </a>
      </div>

      <div className="settings__group">
        <h2 className="account-page__subtitle">{t('settings.delete.title')}</h2>
        <p className="settings__help">{t('settings.delete.help')}</p>
        <a
          className="button button--ghost settings__danger"
          href={`mailto:${PRIVACY_CONTACT_EMAIL}?subject=${subject}`}
        >
          {t('settings.delete.button')}
        </a>
      </div>
    </section>
  );
}
