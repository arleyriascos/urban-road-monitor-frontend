import { useTrips, type TripsDependencies } from '../hooks/useTrips';
import type { TripDetailDependencies } from '../hooks/useTripDetail';
import { useLanguage } from '../i18n/useLanguage';
import { CAMERA_PATH } from './CameraPage';
import { TripCard } from './TripCard';

export interface TripsSectionDependencies {
  trips?: TripsDependencies;
  detail?: TripDetailDependencies;
}

/** "Mis viajes": the trips of the person, newest first, with a button for the next page. */
export function TripsSection({
  token,
  dependencies = {},
}: {
  token: string;
  dependencies?: TripsSectionDependencies;
}) {
  const { t } = useLanguage();
  const { state, loadMore, retry } = useTrips(token, dependencies.trips);

  return (
    <section className="account-page__section" aria-labelledby="account-trips-heading">
      <h1 id="account-trips-heading" className="account-page__title">
        {t('trips.heading')}
      </h1>
      <p className="trips__lead">{t('trips.lead')}</p>

      {state.status === 'loading' && (
        <p className="trip__note" role="status">
          {t('trips.loading')}
        </p>
      )}

      {state.status === 'error' && (
        <div role="alert" className="trips__problem">
          <p className="trips__problem-title">{t('trips.error.title')}</p>
          <button type="button" className="button" onClick={retry}>
            {t('trips.retry')}
          </button>
        </div>
      )}

      {state.status === 'ready' && state.trips.length === 0 && (
        <div className="trips__empty">
          <p className="trips__problem-title">{t('trips.empty.title')}</p>
          <p>{t('trips.empty.help')}</p>
          <a className="button" href={CAMERA_PATH}>
            {t('trips.empty.camera')}
          </a>
        </div>
      )}

      {state.status === 'ready' && state.trips.length > 0 && (
        <>
          <ul className="trips__list" aria-label={t('trips.list.label')}>
            {state.trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                token={token}
                dependencies={dependencies.detail}
              />
            ))}
          </ul>
          {state.more === 'failed' && (
            <p className="trip__note trip__note--error" role="alert">
              {t('trips.moreError')}
            </p>
          )}
          {state.nextCursor !== null && (
            <button
              type="button"
              className="button button--ghost trips__more"
              disabled={state.more === 'loading'}
              onClick={loadMore}
            >
              {state.more === 'loading' ? t('trips.moreLoading') : t('trips.more')}
            </button>
          )}
        </>
      )}
    </section>
  );
}
