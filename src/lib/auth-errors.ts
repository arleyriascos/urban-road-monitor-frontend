import type { ApiError } from '../api/http';

export interface SignInErrorDescription {
  title: string;
  help: string;
}

/** The only answer that means "this session is over": a timeout or a 503 does not. */
export function isSessionGone(error: Pick<ApiError, 'kind' | 'status'>): boolean {
  return error.kind === 'http' && error.status === 401;
}

/** Plain-Spanish explanation of why signing in with Google failed and what to do. */
export function describeSignInError(
  error: Pick<ApiError, 'kind' | 'status' | 'code' | 'details'>,
): SignInErrorDescription {
  if (error.kind === 'timeout') {
    return {
      title: 'El servidor no respondió a tiempo',
      help: 'Puede estar despertando después de un rato sin uso. Intenta de nuevo en unos segundos.',
    };
  }
  if (error.kind === 'network') {
    return {
      title: 'No se pudo conectar con el servidor',
      help: 'Revisa tu conexión a internet e intenta de nuevo, o sigue como invitado.',
    };
  }
  if (error.status === 401) {
    return {
      title: 'No pudimos verificar tu cuenta de Google',
      help: 'Intenta de nuevo. Si sigue igual, revisa que el correo de tu cuenta de Google esté verificado, o sigue como invitado.',
    };
  }
  if (error.status === 403) {
    return {
      title: 'Esta cuenta está desactivada',
      help: 'No puedes ingresar con ella. Puedes seguir como invitado.',
    };
  }
  if (error.status === 429) {
    const seconds = error.details?.retryAfterS;
    const wait =
      typeof seconds === 'number' && seconds > 0
        ? `Espera ${Math.ceil(seconds)} segundos e intenta de nuevo.`
        : 'Espera un minuto e intenta de nuevo.';
    return { title: 'Demasiados intentos de ingreso', help: wait };
  }
  if (error.status === 503) {
    return {
      title: 'El ingreso no está disponible por ahora',
      help: 'El servidor puede estar despertando o Google no respondió. Intenta de nuevo en unos segundos.',
    };
  }
  return {
    title: 'No se pudo ingresar',
    help: 'Intenta de nuevo, o sigue como invitado.',
  };
}
