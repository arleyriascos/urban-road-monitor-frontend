import type { ApiError } from '../api/http';

export interface ErrorDescription {
  title: string;
  help: string;
}

/** Plain-Spanish explanation of what went wrong and what the person can do. */
export function describeError(error: Pick<ApiError, 'kind' | 'status'>): ErrorDescription {
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
