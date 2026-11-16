/** Why the GPS gives no position, in words for the person. */
export type GpsProblem = 'denied' | 'unavailable' | 'unsupported';

/** The numbers of GeolocationPositionError, so the code does not depend on the browser object. */
const PERMISSION_DENIED = 1;

export function classifyGpsError(error: { code?: number } | null | undefined): GpsProblem {
  return error?.code === PERMISSION_DENIED ? 'denied' : 'unavailable';
}

export function describeGpsProblem(problem: GpsProblem): string {
  switch (problem) {
    case 'denied':
      return 'No hay permiso para usar la ubicación. Actívalo en los ajustes del navegador para poder guardar los baches.';
    case 'unsupported':
      return 'Este navegador no puede dar la ubicación, así que los baches no se guardan.';
    case 'unavailable':
      return 'No se logra ubicar el teléfono. Sal a un lugar abierto y espera unos segundos.';
  }
}
