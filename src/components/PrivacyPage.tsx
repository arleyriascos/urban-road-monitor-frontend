import { useLanguage } from '../i18n/useLanguage';
import { Brand } from './BrandMark';
import { PrivacyContentEn, PrivacyContentEs } from './privacy-content';

/** The address of the privacy page. The host rewrites every path to the app, so no router is needed. */
export const PRIVACY_PATH = '/privacidad';

/** Where to ask about the data: the contact of the academic project. */
export const PRIVACY_CONTACT_EMAIL = 'arley.riascos@campusucc.edu.co';

/** What the app does with a person's data, in plain words and in the language of the app. Google asks for this page. */
export function PrivacyPage() {
  const { t, locale } = useLanguage();
  const Content = locale === 'en' ? PrivacyContentEn : PrivacyContentEs;

  return (
    <main className="privacy">
      <article className="panel privacy__card">
        <div className="splash__brand">
          <Brand href="/" subtitle="Pasto · Nariño" />
        </div>
        <h1 className="privacy__title">{t('privacy.title')}</h1>
        <p className="privacy__updated">{t('privacy.updated', { date: t('privacy.updatedAt') })}</p>

        <Content email={PRIVACY_CONTACT_EMAIL} />

        <p className="privacy__back">
          <a href="/">{t('privacy.back')}</a>
        </p>
      </article>
    </main>
  );
}
