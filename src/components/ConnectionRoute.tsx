import { getStopStatuses, STOPS, type RouteState } from '../lib/connection-stops';

/** The path a request travels, drawn as a road with three stops. */
export function ConnectionRoute({ state }: { state: RouteState }) {
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
