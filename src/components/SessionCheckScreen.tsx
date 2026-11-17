import { useEffect, useState } from 'react';
import type { ApiError } from '../api/http';
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
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), SLOW_REQUEST_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const problem = unreachable ? describeError(unreachable) : null;
  const showWaiting = slow || problem !== null;

  return (
    <main className="splash">
      <section className="panel splash__card" aria-live="polite" aria-busy={problem === null}>
        <div className="splash__brand">
          <Brand subtitle="Estado de las calles de Pasto" />
        </div>
        <ConnectionRoute
          state={unreachable ? { status: 'error', error: unreachable } : { status: 'loading' }}
        />
        <div className={`status ${problem ? 'status--error' : 'status--loading'}`}>
          <p className="status__title">{problem ? problem.title : 'Comprobando tu sesión…'}</p>
          <p className="status__help">
            {problem
              ? `${problem.help} Tu sesión sigue guardada y volveremos a intentarlo solos.`
              : 'Estamos confirmando que tu ingreso con Google sigue vigente.'}
          </p>
          {showWaiting && (
            <>
              {!problem && (
                <p className="status__help">
                  El servidor gratuito se duerme cuando nadie lo usa. Está despertando y puede
                  tardar hasta un minuto.
                </p>
              )}
              <div className="entry__buttons">
                <button type="button" className="button" onClick={onRetry}>
                  Intentar de nuevo
                </button>
                <button type="button" className="button button--ghost" onClick={onSkip}>
                  Seguir como invitado por ahora
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
