import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { AccountBadge, type AccountActions } from './components/AccountBadge';
import type { GoogleIdApi } from './lib/google-identity';

/**
 * The whole account flow with the real session hook, store, API calls and entry screen. Only
 * what lives outside the page is replaced: the network, Google's script and the heavy map.
 */
vi.mock('./api/ai-service', () => ({ wakeAiService: vi.fn() }));
vi.mock('./config/env', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./config/env')>()),
  googleClientId: 'client-1',
}));
vi.mock('./components/MapApp', () => ({
  MapApp: ({ account }: { account: AccountActions }) => (
    <div data-testid="map-app">
      <AccountBadge {...account} />
    </div>
  ),
}));

let googleCallback: ((response: { credential: string }) => void) | null = null;
vi.mock('./lib/google-identity', () => ({
  loadGoogleIdentity: () =>
    Promise.resolve({
      initialize: (config: { callback: (response: { credential: string }) => void }) => {
        googleCallback = config.callback;
      },
      renderButton: () => undefined,
    } satisfies GoogleIdApi),
}));

const TOKEN = 'a'.repeat(43);
const TOKEN_KEY = 'urban-road-monitor.session';
const GUEST_KEY = 'urban-road-monitor.guest';
const profile = {
  id: 'u1',
  email: 'ana@example.com',
  fullName: 'Ana Pérez',
  avatarUrl: null,
  roles: ['colaborador'],
  permissions: [],
};

type Handler = (init?: RequestInit) => Response | Promise<Response>;
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const refused = (status: number, code: string) => json(status, { error: { code, message: code } });

function serve(routes: Record<string, Handler>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const path = new URL(String(input)).pathname;
    const handler = routes[`${init?.method ?? 'GET'} ${path}`];
    if (!handler) throw new Error(`unexpected request ${init?.method ?? 'GET'} ${path}`);
    return handler(init);
  });
}

const callsTo = (fetch: ReturnType<typeof serve>, key: string) =>
  fetch.mock.calls.filter(
    ([url, init]) => `${init?.method ?? 'GET'} ${new URL(String(url)).pathname}` === key,
  );

beforeEach(() => {
  window.localStorage.clear();
  window.history.pushState({}, '', '/');
  googleCallback = null;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('the account flow', () => {
  it('lets a guest in without talking to the backend, and remembers it', async () => {
    const fetch = serve({});
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Continuar como invitado' }));

    expect(screen.getByTestId('map-app')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeTruthy();
    expect(window.localStorage.getItem(GUEST_KEY)).toBe('1');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('opens straight on the map the next time for a guest', () => {
    window.localStorage.setItem(GUEST_KEY, '1');
    render(<App />);

    expect(screen.getByTestId('map-app')).toBeTruthy();
  });

  it('signs in with Google, shows the person and remembers the session', async () => {
    const fetch = serve({
      'POST /api/auth/google': () =>
        json(200, {
          token: TOKEN,
          expiresAt: '2026-12-01T00:00:00.000Z',
          user: { ...profile, roles: ['usuario'] },
        }),
    });
    render(<App />);
    await waitFor(() => expect(googleCallback).not.toBeNull());

    await act(async () => {
      googleCallback?.({ credential: 'google-id-token' });
    });

    await screen.findByText('Ana Pérez');
    expect(screen.getByText('Usuario')).toBeTruthy();
    expect(window.localStorage.getItem(TOKEN_KEY)).toBe(TOKEN);
    expect(JSON.parse(String(callsTo(fetch, 'POST /api/auth/google')[0][1]?.body))).toEqual({
      credential: 'google-id-token',
    });
  });

  it('explains a failed sign-in and lets the person go on as a guest', async () => {
    serve({ 'POST /api/auth/google': () => refused(403, 'ACCOUNT_DISABLED') });
    render(<App />);
    await waitFor(() => expect(googleCallback).not.toBeNull());

    await act(async () => {
      googleCallback?.({ credential: 'x' });
    });

    await screen.findByRole('alert');
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar como invitado' }));
    expect(screen.getByTestId('map-app')).toBeTruthy();
  });

  it('checks a saved session when the page opens and shows the person', async () => {
    window.localStorage.setItem(TOKEN_KEY, TOKEN);
    const fetch = serve({ 'GET /api/auth/me': () => json(200, { user: profile }) });
    render(<App />);

    await screen.findByText('Ana Pérez');
    expect(screen.getByText('Colaborador')).toBeTruthy();
    expect(new Headers(fetch.mock.calls[0][1]?.headers).get('Authorization')).toBe(
      `Bearer ${TOKEN}`,
    );
  });

  it('drops a session the backend no longer knows and goes back to the entry', async () => {
    window.localStorage.setItem(TOKEN_KEY, TOKEN);
    serve({ 'GET /api/auth/me': () => refused(401, 'UNAUTHORIZED') });
    render(<App />);

    await screen.findByRole('button', { name: 'Continuar como invitado' });
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(screen.queryByTestId('map-app')).toBeNull();
  });

  it('keeps the session while the server sleeps and shows the person when it wakes', async () => {
    vi.useFakeTimers();
    window.localStorage.setItem(TOKEN_KEY, TOKEN);
    let awake = false;
    const fetch = serve({
      'GET /api/auth/me': () =>
        awake ? json(200, { user: profile }) : refused(503, 'DATABASE_UNAVAILABLE'),
    });
    render(<App />);

    await act(async () => vi.advanceTimersByTimeAsync(100));
    expect(window.localStorage.getItem(TOKEN_KEY)).toBe(TOKEN);
    expect(screen.queryByTestId('map-app')).toBeNull();

    awake = true;
    await act(async () => vi.advanceTimersByTimeAsync(3_000));

    expect(screen.getByText('Ana Pérez')).toBeTruthy();
    expect(callsTo(fetch, 'GET /api/auth/me').length).toBeGreaterThanOrEqual(2);
  });

  it('signs out at once even if the backend fails, and tells the backend which session', async () => {
    window.localStorage.setItem(TOKEN_KEY, TOKEN);
    const fetch = serve({
      'GET /api/auth/me': () => json(200, { user: profile }),
      'POST /api/auth/logout': () => refused(503, 'DATABASE_UNAVAILABLE'),
    });
    render(<App />);
    await screen.findByText('Ana Pérez');

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    await screen.findByRole('button', { name: 'Continuar como invitado' });
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(window.localStorage.getItem(GUEST_KEY)).toBeNull();
    const [logout] = callsTo(fetch, 'POST /api/auth/logout');
    expect(new Headers(logout[1]?.headers).get('Authorization')).toBe(`Bearer ${TOKEN}`);
  });

  it('takes a guest to the entry with Ingresar, and back to the map as a guest again', () => {
    window.localStorage.setItem(GUEST_KEY, '1');
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(screen.queryByTestId('map-app')).toBeNull();
    expect(window.localStorage.getItem(GUEST_KEY)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar como invitado' }));
    expect(screen.getByTestId('map-app')).toBeTruthy();
  });

  it('shows the privacy page without any request or session', () => {
    window.localStorage.setItem(TOKEN_KEY, TOKEN);
    const fetch = serve({});
    window.history.pushState({}, '', '/privacidad');
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Política de privacidad' })).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });
});
