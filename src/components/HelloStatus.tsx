import type { ApiError } from '../api/http';
import type { HelloState } from '../hooks/useHello';

const timeFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'long',
  timeStyle: 'medium',
  timeZone: 'America/Bogota',
});

function describeError(error: ApiError): { title: string; help: string } {
  if (error.kind === 'timeout') {
    return {
      title: 'El servidor no respondió a tiempo',
      help: 'Puede estar despertando después de un rato sin uso. Intenta de nuevo.',
    };
  }
  if (error.kind === 'network') {
    return {
      title: 'No se pudo conectar con el servidor',
      help: 'Revisa tu conexión a internet e intenta de nuevo en unos segundos.',
    };
  }
  if (error.status === 503) {
    return {
      title: 'El servidor respondió, pero la base de datos no está disponible',
      help: 'La base de datos puede estar encendiéndose. Intenta de nuevo en unos segundos.',
    };
  }
  return {
    title: `El servidor respondió con un error (código ${error.status ?? 'desconocido'})`,
    help: 'Intenta de nuevo. Si el error continúa, revisa los registros del servidor en Render.',
  };
}

interface HelloStatusProps {
  state: HelloState;
  onRetry: () => void;
}

/** Shows the loading, error or result state of GET /api/hello. */
export function HelloStatus({ state, onRetry }: HelloStatusProps) {
  if (state.status === 'loading') {
    return (
      <section className="status status--loading" aria-live="polite" aria-busy="true">
        <p className="status__title">Conectando con el servidor…</p>
        {state.slow && (
          <p className="status__help">
            El servidor gratuito se duerme cuando nadie lo usa. Está despertando y puede tardar
            hasta un minuto.
          </p>
        )}
      </section>
    );
  }

  if (state.status === 'error') {
    const { title, help } = describeError(state.error);
    return (
      <section className="status status--error" role="alert">
        <p className="status__title">{title}</p>
        <p className="status__help">{help}</p>
        <button type="button" className="button" onClick={onRetry}>
          Intentar de nuevo
        </button>
      </section>
    );
  }

  const { data } = state;
  return (
    <section className="status status--success" aria-live="polite">
      <p className="hello">{data.message}</p>
      <p className="status__help">
        Este mensaje lo envió el servidor después de consultar la base de datos.
      </p>
      <dl className="facts">
        <div className="facts__row">
          <dt>Base de datos</dt>
          <dd>{data.database.name}</dd>
        </div>
        <div className="facts__row">
          <dt>Hora del servidor</dt>
          <dd>{timeFormatter.format(new Date(data.database.serverTime))}</dd>
        </div>
        <div className="facts__row">
          <dt>Respuesta de la base</dt>
          <dd>{data.database.latencyMs} ms</dd>
        </div>
        <div className="facts__row">
          <dt>Niveles de severidad</dt>
          <dd>
            <ul className="chips">
              {data.database.severityLevels.map((level) => (
                <li key={level} className={`chip chip--${level}`}>
                  {level}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
      <button type="button" className="button button--quiet" onClick={onRetry}>
        Volver a consultar
      </button>
    </section>
  );
}
