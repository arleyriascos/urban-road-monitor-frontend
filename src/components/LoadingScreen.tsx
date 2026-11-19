import { useLanguage } from '../i18n/useLanguage';
import { Brand } from './BrandMark';
import { ConnectionRoute } from './ConnectionRoute';

/** Shown while the map data is on its way. The road shows where the request is. */
export function LoadingScreen({ slow }: { slow: boolean }) {
  const { t } = useLanguage();
  return (
    <main className="splash">
      <section className="panel splash__card" aria-live="polite" aria-busy="true">
        <div className="splash__brand">
          <Brand subtitle={t('topbar.title')} />
        </div>
        <ConnectionRoute state={{ status: 'loading' }} />
        <div className="status status--loading">
          <p className="status__title">{t('loading.title')}</p>
          <p className="status__help">{t('loading.help')}</p>
          {slow && <p className="status__help">{t('wake.slow')}</p>}
        </div>
      </section>
    </main>
  );
}
