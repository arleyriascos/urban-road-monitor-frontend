import type { HelloState } from '../hooks/useHello';

type StopStatus = 'reached' | 'pending' | 'failed';

interface Stop {
  name: string;
  detail: string;
}

const STOPS: Stop[] = [
  { name: 'Tu navegador', detail: 'Frontend en Vercel' },
  { name: 'Servidor', detail: 'API REST en Render' },
  { name: 'Base de datos', detail: 'PostgreSQL en Neon' },
];

/**
 * Status of each stop for the current state.
 * A 503 means the server answered but the database did not.
 */
function getStopStatuses(state: HelloState): StopStatus[] {
  if (state.status === 'success') return ['reached', 'reached', 'reached'];
  if (state.status === 'loading') return ['reached', 'pending', 'pending'];
  if (state.error.kind === 'http' && state.error.status === 503) {
    return ['reached', 'reached', 'failed'];
  }
  return ['reached', 'failed', 'pending'];
}

/** The path a request travels, drawn as a road with three stops. */
export function ConnectionRoute({ state }: { state: HelloState }) {
  const statuses = getStopStatuses(state);

  return (
    <ol className={`route route--${state.status}`} aria-label="Recorrido de la petición">
      {STOPS.map((stop, index) => (
        <li key={stop.name} className={`route__stop route__stop--${statuses[index]}`}>
          <span className="route__marker" aria-hidden="true" />
          <span className="route__name">{stop.name}</span>
          <span className="route__detail">{stop.detail}</span>
        </li>
      ))}
    </ol>
  );
}
