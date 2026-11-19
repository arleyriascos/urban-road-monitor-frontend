import type { ApiError } from '../api/http';
import { useLanguage } from '../i18n/useLanguage';
import { describeError } from '../lib/api-errors';
import { Brand } from './BrandMark';
import { ConnectionRoute } from './ConnectionRoute';

interface ErrorScreenProps {
  error: ApiError;
  onRetry: () => void;
}

/** Shown when the map data could not be loaded. The road marks where the request stopped. */
export function ErrorScreen({ error, onRetry }: ErrorScreenProps) {
  const { t } = useLanguage();
  const { title, help } = describeError(error, t);

  return (
    <main className="splash">
      <section className="panel splash__card" role="alert">
        <div className="splash__brand">
          <Brand subtitle={t('topbar.title')} />
        </div>
        <ConnectionRoute state={{ status: 'error', error }} />
        <div className="status status--error">
          <p className="status__title">{title}</p>
          <p className="status__help">{help}</p>
          <button type="button" className="button" onClick={onRetry}>
            {t('error.retry')}
          </button>
        </div>
      </section>
    </main>
  );
}
