import { useLanguage } from '../i18n/useLanguage';
import { getStopStatuses, STOPS, type RouteState } from '../lib/connection-stops';

/** The path a request travels, drawn as a road with three stops. */
export function ConnectionRoute({ state }: { state: RouteState }) {
  const { t } = useLanguage();
  const statuses = getStopStatuses(state);

  return (
    <ol className={`route route--${state.status}`} aria-label={t('connection.label')}>
      {STOPS.map((stop, index) => (
        <li key={stop.id} className={`route__stop route__stop--${statuses[index]}`}>
          <span className="route__marker" aria-hidden="true" />
          <span className="route__name">{t(stop.nameKey)}</span>
          <span className="route__detail">{t(stop.detailKey)}</span>
        </li>
      ))}
    </ol>
  );
}
