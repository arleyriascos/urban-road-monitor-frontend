import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiUrl } from '../config/env';
import { ApiError } from './http';
import { getMe, signInWithGoogle, signOut } from './auth';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function stubFetch(result: Response | Error) {
  const fetchMock = vi.fn<typeof fetch>(async () => {
    if (result instanceof Error) throw result;
    return result;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const user = {
  id: 'u1',
  email: 'ana@example.com',
  fullName: 'Ana Pérez',
  avatarUrl: null,
  roles: ['usuario'],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('signInWithGoogle', () => {
  it('sends the Google credential and returns the session', async () => {
    const answer = { token: 'a'.repeat(43), expiresAt: '2026-12-01T00:00:00.000Z', user };
    const fetchMock = stubFetch(jsonResponse(answer));

    expect(await signInWithGoogle('google-id-token')).toEqual(answer);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${apiUrl}/api/auth/google`);
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{"credential":"google-id-token"}');
    expect(new Headers(init?.headers).has('Authorization')).toBe(false);
  });

  it('keeps the code of a refused sign-in', async () => {
    stubFetch(jsonResponse({ error: { code: 'INVALID_GOOGLE_TOKEN', message: 'x' } }, 401));

    await expect(signInWithGoogle('x')).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_GOOGLE_TOKEN',
    });
  });
});

describe('getMe', () => {
  it('asks who the session is with the identifier and returns the person', async () => {
    const fetchMock = stubFetch(jsonResponse({ user: { ...user, permissions: [] } }));

    expect(await getMe('the-token')).toEqual({ ...user, permissions: [] });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${apiUrl}/api/auth/me`);
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer the-token');
  });

  it('fails with the 401 when the session no longer lives', async () => {
    stubFetch(jsonResponse({ error: { code: 'UNAUTHORIZED', message: 'x' } }, 401));

    await expect(getMe('dead')).rejects.toMatchObject({ kind: 'http', status: 401 });
  });

  it('fails with a network error, not a 401, when the server cannot be reached', async () => {
    stubFetch(new TypeError('Failed to fetch'));

    const error = await getMe('abc').catch((value: unknown) => value);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: 'network' });
  });
});

describe('signOut', () => {
  it('closes the session with the identifier and accepts the 204', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 204 }));

    await expect(signOut('the-token')).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${apiUrl}/api/auth/logout`);
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer the-token');
  });
});
