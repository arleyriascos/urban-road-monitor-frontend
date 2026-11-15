import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiUrl } from '../config/env';
import { ApiError, getJson, postEmpty, postJson } from './http';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockFetch(implementation: (url: string, init?: RequestInit) => Promise<Response>) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation((input, init) => implementation(String(input), init));
}

async function caught(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.catch((value: unknown) => value);
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getJson', () => {
  it('asks the backend for JSON and returns the body', async () => {
    const fetch = mockFetch(async () => jsonResponse(200, { ok: true }));

    await expect(getJson('/api/health')).resolves.toEqual({ ok: true });

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${apiUrl}/api/health`);
    expect(init?.method).toBe('GET');
    expect(init?.body).toBeUndefined();
  });
});

describe('postJson', () => {
  it('sends the body as JSON', async () => {
    const fetch = mockFetch(async () => jsonResponse(200, { done: 1 }));

    await expect(postJson('/api/routes', { a: 1 })).resolves.toEqual({ done: 1 });

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${apiUrl}/api/routes`);
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{"a":1}');
    expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('keeps the code, message and details of a backend error', async () => {
    mockFetch(async () =>
      jsonResponse(422, {
        error: { code: 'OUTSIDE_NETWORK', message: 'too far', details: { point: 'origin' } },
      }),
    );

    const error = await caught(postJson('/api/routes', {}));

    expect(error.kind).toBe('http');
    expect(error.status).toBe(422);
    expect(error.code).toBe('OUTSIDE_NETWORK');
    expect(error.message).toBe('too far');
    expect(error.details).toEqual({ point: 'origin' });
  });

  it('has no details when the error does not bring them', async () => {
    mockFetch(async () => jsonResponse(404, { error: { code: 'NO_ROUTE', message: 'x' } }));

    expect((await caught(postJson('/api/routes', {}))).details).toBeUndefined();
  });

  it('explains an error that is not JSON with its status', async () => {
    mockFetch(async () => new Response('<html>Bad Gateway</html>', { status: 502 }));

    const error = await caught(postJson('/api/routes', {}));

    expect(error.message).toBe('The server answered with status 502');
    expect(error.code).toBeUndefined();
  });

  it('turns a failed connection into a network error', async () => {
    mockFetch(async () => {
      throw new TypeError('Failed to fetch');
    });

    expect((await caught(postJson('/api/routes', {}))).kind).toBe('network');
  });

  it('turns a slow answer into a timeout error', async () => {
    mockFetch(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        }),
    );

    expect((await caught(postJson('/api/routes', {}, { timeoutMs: 20 }))).kind).toBe('timeout');
  });

  it('lets a request cancelled on purpose fail without an ApiError', async () => {
    mockFetch(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('', 'AbortError')));
        }),
    );
    const controller = new AbortController();

    const request = postJson('/api/routes', {}, { signal: controller.signal });
    controller.abort();

    const error = await request.catch((value: unknown) => value);
    expect(error).not.toBeInstanceOf(ApiError);
  });
});

describe('the session identifier', () => {
  it('goes in the Authorization header of a GET and of a POST when there is one', async () => {
    const fetch = mockFetch(async () => jsonResponse(200, {}));

    await getJson('/api/auth/me', { token: 'abc' });
    await postJson('/api/x', {}, { token: 'abc' });

    expect(new Headers(fetch.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer abc');
    expect(new Headers(fetch.mock.calls[1][1]?.headers).get('Authorization')).toBe('Bearer abc');
  });

  it('is not sent when there is none, so the other requests do not change', async () => {
    const fetch = mockFetch(async () => jsonResponse(200, {}));

    await getJson('/api/road-segments');
    await getJson('/api/road-segments', { token: '' });

    for (const [, init] of fetch.mock.calls) {
      expect(new Headers(init?.headers).has('Authorization')).toBe(false);
    }
  });

  it('keeps a 401 as an ApiError with its status and code, so the session can be closed', async () => {
    mockFetch(async () =>
      jsonResponse(401, {
        error: { code: 'UNAUTHORIZED', message: 'A valid session is required' },
      }),
    );

    const error = await caught(getJson('/api/auth/me', { token: 'abc' }));

    expect(error.kind).toBe('http');
    expect(error.status).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
  });
});

describe('postEmpty', () => {
  it('sends a POST without a body or content type and accepts the 204 answer', async () => {
    const fetch = mockFetch(async () => new Response(null, { status: 204 }));

    await expect(postEmpty('/api/auth/logout', { token: 'abc' })).resolves.toBeUndefined();

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${apiUrl}/api/auth/logout`);
    expect(init?.method).toBe('POST');
    expect(init?.body).toBeUndefined();
    const headers = new Headers(init?.headers);
    expect(headers.has('Content-Type')).toBe(false);
    expect(headers.get('Authorization')).toBe('Bearer abc');
  });

  it('throws the ApiError of a refused request', async () => {
    mockFetch(async () => jsonResponse(401, { error: { code: 'UNAUTHORIZED', message: 'x' } }));

    expect((await caught(postEmpty('/api/auth/logout'))).status).toBe(401);
  });
});
