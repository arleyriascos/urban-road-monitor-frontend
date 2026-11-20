import { describe, expect, it } from 'vitest';
import { translate } from '../i18n/translate';
import { describePasswordProblem, describeSignInError, isSessionGone } from './auth-errors';

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

describe('describeSignInError in English', () => {
  const inEnglish = (
    key: Parameters<typeof translate>[1],
    params?: Parameters<typeof translate>[2],
  ) => translate('en', key, params);
  const describeIn = (error: Parameters<typeof describeSignInError>[0]) =>
    describeSignInError(error, inEnglish);

  it('writes each kind of failure in English', () => {
    expect(describeIn({ kind: 'timeout' }).title).toBe('The server did not answer in time');
    expect(describeIn({ kind: 'network' }).title).toBe('Could not connect to the server');
    expect(describeIn({ kind: 'http', status: 401 }).title).toBe(
      'We could not verify your Google account',
    );
    expect(describeIn({ kind: 'http', status: 403 }).title).toBe('This account is disabled');
    expect(describeIn({ kind: 'http', status: 503 }).title).toBe(
      'Signing in is not available right now',
    );
    expect(describeIn({ kind: 'http', status: 500 }).title).toBe('Could not sign in');
  });

  it('says how long to wait, in English', () => {
    const wait = (retryAfterS: unknown) =>
      describeIn({ kind: 'http', status: 429, details: { retryAfterS } }).help;
    expect(wait(41.2)).toBe('Wait 42 seconds and try again.');
    expect(wait(1)).toBe('Wait 1 second and try again.');
    expect(wait(undefined)).toBe('Wait a minute and try again.');
  });

  it('writes the one second in Spanish too', () => {
    expect(
      describeSignInError({ kind: 'http', status: 429, details: { retryAfterS: 0.4 } }).help,
    ).toBe('Espera 1 segundo e intenta de nuevo.');
  });
});

describe('describeSignInError, for the email and the password', () => {
  it('never says which half was wrong, and points Google accounts to the Google button', () => {
    const description = describeSignInError({
      kind: 'http',
      status: 401,
      code: 'INVALID_CREDENTIALS',
    });
    expect(description.title).toBe('Correo o contraseña incorrectos');
    expect(description.help).toContain('Google');
  });

  it('is not mixed up with the 401 of Google', () => {
    expect(
      describeSignInError({ kind: 'http', status: 401, code: 'INVALID_CREDENTIALS' }).title,
    ).not.toBe(
      describeSignInError({ kind: 'http', status: 401, code: 'INVALID_GOOGLE_TOKEN' }).title,
    );
  });

  it('says that the email already has an account', () => {
    expect(describeSignInError({ kind: 'http', status: 409, code: 'EMAIL_TAKEN' }).title).toBe(
      'Ya existe una cuenta con ese correo',
    );
  });

  it('says which rule a refused password breaks', () => {
    const refuse = (problem: string) =>
      describeSignInError({
        kind: 'http',
        status: 400,
        code: 'INVALID_PASSWORD',
        details: { problem },
      });
    expect(refuse('too_short').title).toBe('Esa contraseña no sirve');
    expect(refuse('too_short').help).toBe('Usa al menos 10 caracteres.');
    expect(refuse('too_common').help).toBe('Es una contraseña muy común: elige otra.');
  });

  it('explains every problem of a password, and one it does not know', () => {
    for (const problem of [
      'too_short',
      'too_long',
      'same_as_email',
      'too_common',
      'same_as_current',
    ]) {
      expect(describePasswordProblem({ problem }).length).toBeGreaterThan(10);
    }
    expect(describePasswordProblem(undefined)).toBe('Elige otra contraseña e intenta de nuevo.');
    expect(describePasswordProblem({ problem: 'new-rule' })).toBe(
      'Elige otra contraseña e intenta de nuevo.',
    );
  });

  it('speaks English when asked', () => {
    const t = (key: Parameters<typeof translate>[1], params?: Parameters<typeof translate>[2]) =>
      translate('en', key, params);
    expect(
      describeSignInError({ kind: 'http', status: 401, code: 'INVALID_CREDENTIALS' }, t).title,
    ).toBe('Wrong email or password');
  });
});
