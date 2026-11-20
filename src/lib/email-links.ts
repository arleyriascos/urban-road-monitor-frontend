/** The address of the page that proves an email. The host rewrites every path to the app. */
export const VERIFY_PATH = '/verificar';
/** The address of the page that chooses a new password. */
export const RESET_PATH = '/restablecer';

/** A token as the backend makes it: 32 random bytes in base64url, 43 characters. */
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{43}$/;

/**
 * The token of a link, read from the part after "#". It travels there and not in the query
 * because the part after "#" is never sent to a server, nor in the Referer of a later request.
 * Anything that is not the shape of a token is no token.
 */
export function readLinkToken(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const token = params.get('token');
  return token !== null && TOKEN_SHAPE.test(token) ? token : null;
}

/** Takes the part after "#" out of the address, so the token is not left in the history or on the screen. */
export function clearLinkFragment(): void {
  const { pathname, search } = window.location;
  window.history.replaceState(window.history.state, '', `${pathname}${search}`);
}
