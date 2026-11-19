import { useEffect, useState } from 'react';
import type { ApiError } from '../api/http';
import { useLanguage } from '../i18n/useLanguage';
import { describeError } from '../lib/api-errors';
import { SLOW_REQUEST_MS } from '../hooks/useMapData';
import { Brand } from './BrandMark';
import { ConnectionRoute } from './ConnectionRoute';

interface SessionCheckScreenProps {
  /** The last error when the server did not answer; null while the first try is on its way. */
  unreachable: ApiError | null;
  onRetry: () => void;
  /** Go on as a guest for now; the saved session is kept and checked next time. */
  onSkip: () => void;
}

/**
 * Shown while the saved session is checked. A server that does not answer is not a closed
 * session: the person keeps it, sees what is happening, and may go on as a guest meanwhile.
 */
export function SessionCheckScreen({ unreachable, onRetry, onSkip }: SessionCheckScreenProps) {
  const { t } = useLanguage();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), SLOW_REQUEST_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const problem = unreachable ? describeError(unreachable, t) : null;
  const showWaiting = slow || problem !== null;

  return (
    <main className="splash">
      <section className="panel splash__card" aria-live="polite" aria-busy={problem === null}>
        <div className="splash__brand">
          <Brand subtitle={t('topbar.title')} />
        </div>
        <ConnectionRoute
          state={unreachable ? { status: 'error', error: unreachable } : { status: 'loading' }}
        />
        <div className={`status ${problem ? 'status--error' : 'status--loading'}`}>
          <p className="status__title">{problem ? problem.title : t('session.checking.title')}</p>
          <p className="status__help">
            {problem ? `${problem.help} ${t('session.kept')}` : t('session.checking.help')}
          </p>
          {showWaiting && (
            <>
              {!problem && <p className="status__help">{t('wake.slow')}</p>}
              <div className="entry__buttons">
                <button type="button" className="button" onClick={onRetry}>
                  {t('session.retry')}
                </button>
                <button type="button" className="button button--ghost" onClick={onSkip}>
                  {t('session.skip')}
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
