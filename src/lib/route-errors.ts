import type { ApiError } from '../api/http';
import { formatLength } from './format';

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
}

const POINT_NAME: Record<RoutePointName, string> = { origin: 'origen', destination: 'destino' };

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

/** Plain-Spanish explanation of why there is no route and what the person can do. */
export function describeRouteError(
  error: Pick<ApiError, 'kind' | 'status' | 'code' | 'details'>,
): RouteErrorDescription {
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

  switch (error.code) {
    case 'NO_ROUTE':
      return {
        title: 'No hay un camino entre estos puntos',
        help: 'La ruta debe respetar el sentido de las calles. Prueba moviendo el origen o el destino.',
      };
    case 'OUTSIDE_NETWORK': {
      const point = pointDetail(error);
      const distance = numberDetail(error, 'distanceM');
      const limit = numberDetail(error, 'maxDistanceM');
      const where =
        distance !== undefined && limit !== undefined
          ? `Está a ${formatLength(distance)} de la calle más cercana y el máximo es ${formatLength(limit)}. `
          : '';
      return {
        title: point
          ? `El ${POINT_NAME[point]} quedó lejos de las calles`
          : 'Un punto quedó lejos de las calles',
        help: `${where}Muévelo más cerca de una calle.`,
        point,
      };
    }
    case 'TOO_MANY_REQUESTS':
      return {
        title: 'Demasiadas rutas seguidas',
        help: 'El servidor acepta hasta 30 rutas por minuto. Espera un momento y vuelve a intentar.',
        waitS: retryAfterSeconds(error),
      };
    case 'ROUTE_SERVICE_UNAVAILABLE':
      if (retryAfterSeconds(error) !== undefined) {
        return {
          title: 'El servicio de rutas no despertó a tiempo',
          help: 'Ábrelo en una pestaña nueva para despertarlo, espera a que cargue y vuelve a intentar.',
          wakeLink: true,
        };
      }
      return {
        title: 'El servicio de rutas no está disponible',
        help: 'Intenta de nuevo en un momento.',
      };
    case 'DATABASE_UNAVAILABLE':
      return {
        title: 'La base de datos no está disponible',
        help: 'Puede estar encendiéndose. Intenta de nuevo en unos segundos.',
      };
    case 'INVALID_REQUEST':
    case 'INVALID_JSON':
      return {
        title: 'La app pidió la ruta con datos inválidos',
        help: 'Vuelve a poner el origen y el destino. Si se repite, es un error de la app.',
      };
    default:
      return {
        title: `El servidor respondió con un error (código ${error.status ?? 'desconocido'})`,
        help: 'Intenta de nuevo en un momento.',
      };
  }
}
