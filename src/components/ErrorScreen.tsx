import type { ApiError } from '../api/http';
import { describeError } from '../lib/api-errors';
import { Brand } from './BrandMark';
import { ConnectionRoute } from './ConnectionRoute';

interface ErrorScreenProps {
  error: ApiError;
  onRetry: () => void;
}

/** Shown when the map data could not be loaded. The road marks where the request stopped. */
export function ErrorScreen({ error, onRetry }: ErrorScreenProps) {
  const { title, help } = describeError(error);

  return (
    <main className="splash">
      <section className="panel splash__card" role="alert">
        <div className="splash__brand">
          <Brand subtitle="Estado de las calles de Pasto" />
        </div>
        <ConnectionRoute state={{ status: 'error', error }} />
        <div className="status status--error">
          <p className="status__title">{title}</p>
          <p className="status__help">{help}</p>
          <button type="button" className="button" onClick={onRetry}>
            Intentar de nuevo
          </button>
        </div>
      </section>
    </main>
  );
}
