import type { AccountProfile } from '../types/auth';

/** The permission the backend asks for to record detections (every signed-in account has it). */
export const RECORD_PERMISSION = 'detections.create';

/**
 * - `guest`: nobody signed in. The camera asks to sign in: with no account nothing can be saved.
 * - `checking`: asking the backend who the session belongs to.
 * - `allowed`: a signed-in account that may record: the detections are saved and sent.
 * - `no_permission`: signed in, but the account cannot record (an administrator took it away).
 * - `session_over`: the saved session no longer lives.
 * - `unreachable`: the backend did not answer; it is asked again.
 */
export type SendAccess =
  | { status: 'guest' }
  | { status: 'checking' }
  | { status: 'allowed'; token: string; userId: string }
  | { status: 'no_permission' }
  | { status: 'session_over' }
  | { status: 'unreachable' };

export function accessOf(
  profile: Pick<AccountProfile, 'id' | 'permissions'>,
  token: string,
): SendAccess {
  return profile.permissions.includes(RECORD_PERMISSION)
    ? { status: 'allowed', token, userId: profile.id }
    : { status: 'no_permission' };
}

/** What the camera screen tells the person about saving, in one sentence. */
export function describeAccess(access: SendAccess): string {
  switch (access.status) {
    case 'guest':
      return 'Ingresa con tu cuenta de Google para detectar y guardar baches.';
    case 'checking':
      return 'Revisando tu cuenta…';
    case 'allowed':
      return 'Los baches que veas se guardan y se envían a tu nombre.';
    case 'no_permission':
      return 'Tu cuenta no tiene permiso para guardar baches. Pide a un administrador que la revise.';
    case 'session_over':
      return 'Tu sesión terminó, así que los baches no se guardan. Vuelve al mapa e ingresa de nuevo.';
    case 'unreachable':
      return 'No se pudo revisar tu cuenta. Se intentará de nuevo en unos segundos.';
  }
}
