import { useId, useState } from 'react';
import type { TripDetailDependencies } from '../hooks/useTripDetail';
import { useTripDetail } from '../hooks/useTripDetail';
import { useLanguage } from '../i18n/useLanguage';
import { formatDateTime } from '../lib/dates';
import { formatLength, formatNumber } from '../lib/format';
import { formatMinutes, tripMinutes } from '../lib/trip-format';
import type { TripSummary } from '../types/trips';

/** The detections of a trip by severity, read from the server when the details are opened. */
function TripDetail({
  token,
  tripId,
  dependencies,
}: {
  token: string;
  tripId: string;
  dependencies?: TripDetailDependencies;
}) {
  const { t, locale } = useLanguage();
  const state = useTripDetail(token, tripId, dependencies);

  if (state.status === 'loading') {
    return (
      <p className="trip__note" role="status">
        {t('trips.details.loading')}
      </p>
    );
  }
  if (state.status === 'failed') {
    return (
      <p className="trip__note trip__note--error" role="alert">
        {t('trips.details.error')}
      </p>
    );
  }
  return (
    <div>
      <h3 className="trip__subtitle">{t('trips.details.bySeverity')}</h3>
      <ul className="trip__severities">
        {state.trip.detections.bySeverity.map(({ severity, count }) => (
          <li key={severity} className={`trip__severity trip__severity--${severity}`}>
            <span className="trip__dot" aria-hidden="true" />
            {t(`severity.${severity}`)}
            <b>{formatNumber(count, locale)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One trip: when, how far and how long, and how many potholes it found; the details open apart. */
export function TripCard({
  trip,
  token,
  dependencies,
}: {
  trip: TripSummary;
  token: string;
  dependencies?: TripDetailDependencies;
}) {
  const { t, locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const detailId = useId();
  const minutes = tripMinutes(trip.startedAt, trip.endedAt);

  return (
    <li className="trip">
      <div className="trip__top">
        <h2 className="trip__date">{formatDateTime(trip.startedAt, locale)}</h2>
        {trip.endedAt === null && <span className="trip__badge">{t('trips.open')}</span>}
      </div>
      <dl className="trip__facts">
        <div>
          <dt>{t('trips.distance')}</dt>
          <dd>{formatLength(trip.distanceM, locale)}</dd>
        </div>
        <div>
          <dt>{t('trips.duration')}</dt>
          <dd>{minutes === null ? '—' : formatMinutes(minutes)}</dd>
        </div>
        <div>
          <dt>{t('trips.detections')}</dt>
          <dd>
            {trip.detectionCount === 0
              ? t('trips.detections.none')
              : formatNumber(trip.detectionCount, locale)}
          </dd>
        </div>
      </dl>
      <button
        type="button"
        className="button button--ghost trip__toggle"
        aria-expanded={open}
        aria-controls={open ? detailId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? t('trips.details.hide') : t('trips.details.show')}
      </button>
      {open && (
        <div id={detailId} className="trip__detail">
          <dl className="trip__facts">
            <div>
              <dt>{t('trips.frames')}</dt>
              <dd>{formatNumber(trip.framesAnalyzed, locale)}</dd>
            </div>
            <div>
              <dt>{t('trips.device')}</dt>
              <dd>{trip.deviceLabel ?? t(`trips.device.${trip.platform}`)}</dd>
            </div>
            <div>
              <dt>{t('trips.model')}</dt>
              <dd>{trip.modelVersion}</dd>
            </div>
          </dl>
          <TripDetail token={token} tripId={trip.id} dependencies={dependencies} />
        </div>
      )}
    </li>
  );
}
