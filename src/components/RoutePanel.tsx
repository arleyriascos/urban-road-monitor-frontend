import { useEffect, useState, type ComponentProps } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { MAX_WAKE_ATTEMPTS, type RouteState } from '../hooks/useRoute';
import { formatDecimal } from '../lib/format';
import { describeRouteError } from '../lib/route-errors';
import type { Texts, Translator } from '../lib/translator';
import type { RouteGroup } from '../lib/route-groups';
import type { LatLng, RouteCriterion } from '../types/route';
import { CriterionPicker } from './CriterionPicker';
import { Icon } from './Icon';
import { RouteDetails } from './RouteDetails';
import { RouteSteps } from './RouteSteps';

interface RoutePanelProps {
  origin: LatLng | null;
  destination: LatLng | null;
  criterion: RouteCriterion;
  state: RouteState;
  /** Changes with every request, so a repeated error starts its countdown again. */
  requestKey?: string;
  /** Address that wakes the route service in a new tab, or null when it is not configured. */
  wakeUrl: string | null;
  /** The route street by street, and the street picked (null when none is). */
  groups?: readonly RouteGroup[];
  selected?: number | null;
  onSelect?: (index: number | null) => void;
  /** Asks for the same route again with the other algorithm; replaced in tests. */
  fetchRoute?: ComponentProps<typeof RouteDetails>['fetchRoute'];
  onCriterionChange: (value: RouteCriterion) => void;
  onRetry: () => void;
  onSwap: () => void;
  onClear: () => void;
  onClose: () => void;
}

function hint(origin: LatLng | null, destination: LatLng | null, t: Translator): string {
  if (!origin) return t('route.hint.origin');
  if (!destination) return t('route.hint.destination');
  return t('route.hint.both');
}

/** Where a point was placed, as latitude and longitude. */
function describePoint(point: LatLng | null, { t, locale }: Texts): string {
  if (!point) return t('route.point.unset');
  return `${formatDecimal(point.latitude, 5, locale)} · ${formatDecimal(point.longitude, 5, locale)}`;
}

/** The two points of the route: A is the origin and B the destination. */
function RoutePoints({
  origin,
  destination,
}: {
  origin: LatLng | null;
  destination: LatLng | null;
}) {
  const language = useLanguage();
  const { t } = language;
  const points = [
    { letter: 'A', name: t('route.point.origin'), point: origin, modifier: 'origin' },
    {
      letter: 'B',
      name: t('route.point.destination'),
      point: destination,
      modifier: 'destination',
    },
  ];
  return (
    <ul className="route-points" aria-label={t('route.points.label')}>
      {points.map(({ letter, name, point, modifier }) => (
        <li key={letter} className="route-points__item">
          <span
            className={`route-points__badge route-points__badge--${modifier}`}
            aria-hidden="true"
          >
            {letter}
          </span>
          <span className="route-points__text">
            <span className="route-points__name">{name}</span>
            <span
              className={
                point ? 'route-points__value' : 'route-points__value route-points__value--empty'
              }
            >
              {describePoint(point, language)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** "Reintentar", which waits the seconds the server asked for before it can be used. */
function RetryButton({ waitS = 0, onRetry }: { waitS?: number; onRetry: () => void }) {
  const { t } = useLanguage();
  const [left, setLeft] = useState(Math.ceil(waitS));
  const counting = left > 0;

  useEffect(() => {
    if (!counting) return;
    const timer = window.setInterval(() => setLeft((value) => (value <= 1 ? 0 : value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [counting]);

  return (
    <button type="button" className="route-button" onClick={onRetry} disabled={counting}>
      {counting ? t('route.retryIn', { seconds: left }) : t('route.retry')}
    </button>
  );
}

function RouteStatus({
  state,
  requestKey = '',
  wakeUrl,
  onRetry,
}: Pick<RoutePanelProps, 'state' | 'requestKey' | 'wakeUrl' | 'onRetry'>) {
  const language = useLanguage();
  const { t } = language;
  switch (state.status) {
    case 'idle':
      return null;
    case 'loading':
      return (
        <p className="route-status" role="status">
          {t('route.status.loading')}
        </p>
      );
    case 'waking':
      return (
        <div className="route-status" role="status">
          <p className="route-status__title">{t('route.status.waking.title')}</p>
          <p className="route-status__help">
            {t('route.status.waking.help', { attempt: state.attempt, max: MAX_WAKE_ATTEMPTS })}
          </p>
        </div>
      );
    case 'success':
      return (
        <p className="route-status route-status--ok" role="status">
          {t('route.status.ready')}
          {state.route.fromCache ? (
            <span className="route-status__note"> {t('route.status.cache')}</span>
          ) : null}
        </p>
      );
    case 'error': {
      const description = describeRouteError(state.error, language);
      return (
        <div className="route-status route-status--error" role="alert">
          <p className="route-status__title">{description.title}</p>
          <p className="route-status__help">{description.help}</p>
          <div className="route-panel__actions">
            {description.retryable ? (
              <RetryButton key={requestKey} waitS={description.waitS} onRetry={onRetry} />
            ) : null}
            {description.wakeLink && wakeUrl ? (
              <a className="route-link" href={wakeUrl} target="_blank" rel="noopener noreferrer">
                {t('route.wakeLink')}
              </a>
            ) : null}
          </div>
        </div>
      );
    }
  }
}

/** The "Directions" panel: how to place the points, the criterion and the state of the route. */
export function RoutePanel(props: RoutePanelProps) {
  const { origin, destination, criterion, onCriterionChange, onSwap, onClear, onClose } = props;
  const { groups = [], selected = null, onSelect = () => undefined } = props;
  const { t } = useLanguage();

  return (
    <section className="route-panel" aria-label={t('route.panel.title')}>
      <div className="route-panel__header">
        <h2 className="route-panel__title">{t('route.panel.title')}</h2>
        <button
          type="button"
          className="route-panel__close"
          onClick={onClose}
          aria-label={t('route.panel.close')}
        >
          <Icon name="close" />
        </button>
      </div>
      <p className="route-panel__hint">{hint(origin, destination, t)}</p>
      <RoutePoints origin={origin} destination={destination} />
      <CriterionPicker value={criterion} onChange={onCriterionChange} />
      <RouteStatus
        state={props.state}
        requestKey={props.requestKey}
        wakeUrl={props.wakeUrl}
        onRetry={props.onRetry}
      />
      {props.state.status === 'success' && origin && destination ? (
        <>
          <RouteDetails
            route={props.state.route}
            groups={groups}
            origin={origin}
            destination={destination}
            criterion={criterion}
            fetchRoute={props.fetchRoute}
          />
          <RouteSteps groups={groups} selected={selected} onSelect={onSelect} />
        </>
      ) : null}
      <div className="route-panel__actions">
        <button
          type="button"
          className="route-button route-button--quiet"
          onClick={onSwap}
          disabled={!origin || !destination}
        >
          <Icon name="swap" />
          {t('route.swap')}
        </button>
        <button
          type="button"
          className="route-button route-button--quiet"
          onClick={onClear}
          disabled={!origin && !destination}
        >
          {t('route.clear')}
        </button>
      </div>
    </section>
  );
}
