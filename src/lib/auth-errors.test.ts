import { describe, expect, it } from 'vitest';
import { describeSignInError, isSessionGone } from './auth-errors';

describe('isSessionGone', () => {
  it('is true only for a 401 answer of the server', () => {
    expect(isSessionGone({ kind: 'http', status: 401 })).toBe(true);
  });

  it.each([
    { kind: 'http', status: 503 },
    { kind: 'http', status: 500 },
    { kind: 'http', status: 403 },
    { kind: 'http', status: 429 },
    { kind: 'timeout' },
    { kind: 'network' },
  ] as const)('is false for %j, which says nothing about the session', (error) => {
    expect(isSessionGone(error)).toBe(false);
  });
});

describe('describeSignInError', () => {
  it('explains a token Google could not verify', () => {
    expect(
      describeSignInError({ kind: 'http', status: 401, code: 'INVALID_GOOGLE_TOKEN' }),
    ).toEqual(expect.objectContaining({ title: 'No pudimos verificar tu cuenta de Google' }));
  });

  it('explains a disabled account', () => {
    expect(describeSignInError({ kind: 'http', status: 403, code: 'ACCOUNT_DISABLED' }).title).toBe(
      'Esta cuenta está desactivada',
    );
  });

  it('says how long to wait when the server says so', () => {
    const description = describeSignInError({
      kind: 'http',
      status: 429,
      code: 'TOO_MANY_REQUESTS',
      details: { retryAfterS: 41.2 },
    });
    expect(description.title).toBe('Demasiados intentos de ingreso');
    expect(description.help).toBe('Espera 42 segundos e intenta de nuevo.');
  });

  it.each([{}, { retryAfterS: 'soon' }, { retryAfterS: 0 }, undefined])(
    'asks to wait a minute when the 429 gives no usable time: %j',
    (details) => {
      expect(describeSignInError({ kind: 'http', status: 429, details }).help).toBe(
        'Espera un minuto e intenta de nuevo.',
      );
    },
  );

  it('tells a sleeping server from a missing connection', () => {
    expect(describeSignInError({ kind: 'timeout' }).title).toBe(
      'El servidor no respondió a tiempo',
    );
    expect(describeSignInError({ kind: 'network' }).title).toBe(
      'No se pudo conectar con el servidor',
    );
    expect(describeSignInError({ kind: 'http', status: 503 }).title).toBe(
      'El ingreso no está disponible por ahora',
    );
  });

  it('has a plain answer for anything else', () => {
    expect(describeSignInError({ kind: 'http', status: 500 }).title).toBe('No se pudo ingresar');
  });

  it('always offers a way out: another try or the guest mode', () => {
    for (const status of [401, 403, 429, 503, 500]) {
      const { help } = describeSignInError({ kind: 'http', status });
      expect(help).toMatch(/intenta|espera|invitado/i);
    }
  });
});
