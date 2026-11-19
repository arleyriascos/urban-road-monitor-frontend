import type { ApiError } from '../api/http';
import { formatLength } from './format';
import { defaultTexts, type Texts } from './translator';

export type RoutePointName = 'origin' | 'destination';

export interface RouteErrorDescription {
  title: string;
  help: string;
  /** The point to highlight on the map, when the error is about one of them. */
  point?: RoutePointName;
  /** Seconds to wait before asking again (too many requests). */
  waitS?: number;
  /** Offer the link that wakes the route service in a new tab. */
  wakeLink?: boolean;
  /** Whether asking again with the same points can help; if not, the person must change them. */
  retryable: boolean;
}

function numberDetail(error: Pick<ApiError, 'details'>, key: string): number | undefined {
  const value = error.details?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function pointDetail(error: Pick<ApiError, 'details'>): RoutePointName | undefined {
  const value = error.details?.point;
  return value === 'origin' || value === 'destination' ? value : undefined;
}

/** Seconds the backend asks to wait before trying again, if it says so. */
export function retryAfterSeconds(error: Pick<ApiError, 'details'>): number | undefined {
  return numberDetail(error, 'retryAfterS');
}

/** Plain explanation of why there is no route and what the person can do, in their language. */
export function describeRouteError(
  error: Pick<ApiError, 'kind' | 'status' | 'code' | 'details'>,
  { t, locale }: Texts = defaultTexts,
): RouteErrorDescription {
  if (error.kind === 'timeout') {
    return {
      title: t('apiError.timeout.title'),
      help: t('apiError.timeout.help'),
      retryable: true,
    };
  }
  if (error.kind === 'network') {
    return {
      title: t('apiError.network.title'),
      help: t('apiError.network.help'),
      retryable: true,
    };
  }

  switch (error.code) {
    case 'NO_ROUTE':
      return {
        title: t('routeError.noRoute.title'),
        help: t('routeError.noRoute.help'),
        retryable: false,
      };
    case 'OUTSIDE_NETWORK': {
      const point = pointDetail(error);
      const distance = numberDetail(error, 'distanceM');
      const limit = numberDetail(error, 'maxDistanceM');
      const where =
        distance !== undefined && limit !== undefined
          ? `${t('routeError.outside.where', {
              distance: formatLength(distance, locale),
              limit: formatLength(limit, locale),
            })} `
          : '';
      const title = point
        ? t(point === 'origin' ? 'routeError.outside.origin' : 'routeError.outside.destination')
        : t('routeError.outside.point');
      return { title, help: `${where}${t('routeError.outside.help')}`, point, retryable: false };
    }
    case 'TOO_MANY_REQUESTS':
      return {
        title: t('routeError.tooMany.title'),
        help: t('routeError.tooMany.help'),
        waitS: retryAfterSeconds(error),
        retryable: true,
      };
    case 'ROUTE_SERVICE_UNAVAILABLE':
      if (retryAfterSeconds(error) !== undefined) {
        return {
          title: t('routeError.noWake.title'),
          help: t('routeError.noWake.help'),
          wakeLink: true,
          retryable: true,
        };
      }
      return {
        title: t('routeError.unavailable.title'),
        help: t('routeError.tryLater'),
        retryable: true,
      };
    case 'DATABASE_UNAVAILABLE':
      return {
        title: t('routeError.database.title'),
        help: t('apiError.database.help'),
        retryable: true,
      };
    case 'INVALID_REQUEST':
    case 'INVALID_JSON':
      return {
        title: t('routeError.invalid.title'),
        help: t('routeError.invalid.help'),
        retryable: false,
      };
    default:
      return {
        title: t('apiError.other.title', { status: error.status ?? t('apiError.other.unknown') }),
        help: t('routeError.tryLater'),
        retryable: true,
      };
  }
}
