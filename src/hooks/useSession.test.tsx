import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import { createSessionStore } from '../lib/session-storage';
import type { AccountProfile, GoogleLoginAnswer } from '../types/auth';
import { checkRetryDelayMs, useSession, type SessionDependencies } from './useSession';

const TOKEN = 'T'.repeat(43);
const NEW_TOKEN = 'N'.repeat(43);
const profile: AccountProfile = {
  id: 'u1',
  email: 'ana@example.com',
  fullName: 'Ana Pérez',
  avatarUrl: null,
  roles: ['usuario'],
  permissions: [],
  hasPassword: false,
  emailVerified: true,
};
const gone = () => new ApiError('http', 'no', 401, 'UNAUTHORIZED');
const asleep = () => new ApiError('http', 'asleep', 503, 'DATABASE_UNAVAILABLE');

function memoryStore(saved: { token?: string; guest?: boolean } = {}) {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  } as Storage;
  const store = createSessionStore(() => storage);
  if (saved.token) store.saveToken(saved.token);
  if (saved.guest) store.saveGuest();
  return store;
}

function makeDependencies(saved: { token?: string; guest?: boolean } = {}) {
  const store = memoryStore(saved);
  const getMe = vi.fn<SessionDependencies['getMe']>(() => Promise.resolve(profile));
  const signInWithGoogle = vi.fn<SessionDependencies['signInWithGoogle']>(() =>
    Promise.resolve({ token: NEW_TOKEN, expiresAt: 'x', user: profile } as GoogleLoginAnswer),
  );
  const signInWithPassword = vi.fn<SessionDependencies['signInWithPassword']>(() =>
    Promise.resolve({ token: NEW_TOKEN, expiresAt: 'x', user: profile } as GoogleLoginAnswer),
  );
  const registerWithPassword = vi.fn<SessionDependencies['registerWithPassword']>(() =>
    Promise.resolve({ token: NEW_TOKEN, expiresAt: 'x', user: profile } as GoogleLoginAnswer),
  );
  const signOut = vi.fn<SessionDependencies['signOut']>(() => Promise.resolve());
  const dependencies: SessionDependencies = {
    store,
    getMe,
    signInWithGoogle,
    signInWithPassword,
    registerWithPassword,
    signOut,
  };
  return {
    dependencies,
    store,
    getMe,
    signInWithGoogle,
    signInWithPassword,
    registerWithPassword,
    signOut,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('opening the page', () => {
  it('shows the entry when nothing is saved, without asking the backend anything', () => {
    const { dependencies, getMe } = makeDependencies();
    const { result } = renderHook(() => useSession(dependencies));

    expect(result.current.state).toEqual({ status: 'entry', signIn: { phase: 'idle' } });
    expect(getMe).not.toHaveBeenCalled();
  });

  it('goes straight to the map as a guest when that was the choice', () => {
    const { dependencies, getMe } = makeDependencies({ guest: true });
    const { result } = renderHook(() => useSession(dependencies));

    expect(result.current.state).toEqual({ status: 'guest', remembered: true });
    expect(getMe).not.toHaveBeenCalled();
  });

  it('checks a saved identifier and signs the person in when it still lives', async () => {
    const { dependencies, getMe } = makeDependencies({ token: TOKEN });
    const { result } = renderHook(() => useSession(dependencies));

    expect(result.current.state.status).toBe('checking');
    await waitFor(() => expect(result.current.state.status).toBe('signed_in'));
    expect(getMe).toHaveBeenCalledWith(TOKEN, expect.any(AbortSignal));
    expect(result.current.state).toMatchObject({
      token: TOKEN,
      user: { email: 'ana@example.com' },
    });
  });

  it('closes the session on a 401: forgets the identifier and goes to the entry', async () => {
    const { dependencies, getMe, store } = makeDependencies({ token: TOKEN });
    getMe.mockRejectedValue(gone());
    const { result } = renderHook(() => useSession(dependencies));

    await waitFor(() => expect(result.current.state.status).toBe('entry'));
    expect(store.readToken()).toBeNull();
  });
});

describe('a server that does not answer', () => {
  it('keeps the identifier, shows the wait and asks again by itself', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { dependencies, getMe, store } = makeDependencies({ token: TOKEN });
    getMe.mockRejectedValueOnce(asleep()).mockResolvedValue(profile);
    const { result } = renderHook(() => useSession(dependencies));

    await waitFor(() =>
      expect(result.current.state).toMatchObject({
        status: 'checking',
        unreachable: expect.any(ApiError),
      }),
    );
    expect(store.readToken()).toBe(TOKEN);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(checkRetryDelayMs(0));
    });

    await waitFor(() => expect(result.current.state.status).toBe('signed_in'));
    expect(getMe).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['a timeout', new ApiError('timeout', 'slow')],
    ['no connection', new ApiError('network', 'down')],
    ['a 500', new ApiError('http', 'boom', 500)],
    ['something that is not an ApiError', new TypeError('weird')],
  ])('keeps the identifier after %s too', async (_name, error) => {
    const { dependencies, getMe, store } = makeDependencies({ token: TOKEN });
    getMe.mockRejectedValue(error);
    const { result } = renderHook(() => useSession(dependencies));

    await waitFor(() =>
      expect(result.current.state).toMatchObject({
        status: 'checking',
        unreachable: expect.anything(),
      }),
    );
    expect(store.readToken()).toBe(TOKEN);
  });

  it('asks again at once when the person presses the button', async () => {
    const { dependencies, getMe } = makeDependencies({ token: TOKEN });
    getMe.mockRejectedValueOnce(asleep()).mockResolvedValue(profile);
    const { result } = renderHook(() => useSession(dependencies));
    await waitFor(() =>
      expect(result.current.state).toMatchObject({ unreachable: expect.anything() }),
    );

    act(() => result.current.retryCheck());

    await waitFor(() => expect(result.current.state.status).toBe('signed_in'));
  });

  it('lets the person go on as a guest for now and keeps the session saved', async () => {
    const { dependencies, getMe, store } = makeDependencies({ token: TOKEN });
    getMe.mockRejectedValue(asleep());
    const { result } = renderHook(() => useSession(dependencies));
    await waitFor(() =>
      expect(result.current.state).toMatchObject({ unreachable: expect.anything() }),
    );

    act(() => result.current.skipCheck());

    expect(result.current.state).toEqual({ status: 'guest', remembered: false });
    expect(store.readToken()).toBe(TOKEN);
    expect(store.isGuest()).toBe(false);
  });

  it('stops asking when the hook goes away', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { dependencies, getMe } = makeDependencies({ token: TOKEN });
    getMe.mockRejectedValue(asleep());
    const { result, unmount } = renderHook(() => useSession(dependencies));
    await waitFor(() =>
      expect(result.current.state).toMatchObject({ unreachable: expect.anything() }),
    );

    unmount();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(getMe).toHaveBeenCalledTimes(1);
  });
});

describe('signing in', () => {
  it('saves the identifier, drops the guest choice and signs the person in', async () => {
    const { dependencies, signInWithGoogle, store } = makeDependencies({ guest: true });
    const { result } = renderHook(() => useSession(dependencies));
    act(() => result.current.requestSignIn());

    await act(() => result.current.signInWithCredential('google-token'));

    expect(signInWithGoogle).toHaveBeenCalledWith('google-token');
    expect(result.current.state).toMatchObject({ status: 'signed_in', token: NEW_TOKEN });
    expect(store.readToken()).toBe(NEW_TOKEN);
    expect(store.isGuest()).toBe(false);
  });

  it("shows the error and saves nothing when Google's token is refused", async () => {
    const { dependencies, signInWithGoogle, store } = makeDependencies();
    const refused = new ApiError('http', 'x', 401, 'INVALID_GOOGLE_TOKEN');
    signInWithGoogle.mockRejectedValue(refused);
    const { result } = renderHook(() => useSession(dependencies));

    await act(() => result.current.signInWithCredential('bad'));

    expect(result.current.state).toEqual({
      status: 'entry',
      signIn: { phase: 'failed', error: refused },
    });
    expect(store.readToken()).toBeNull();
  });

  it('ignores a second credential while the first is on its way', async () => {
    const { dependencies, signInWithGoogle } = makeDependencies();
    signInWithGoogle.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useSession(dependencies));

    act(() => void result.current.signInWithCredential('one'));
    await act(() => result.current.signInWithCredential('two'));

    expect(signInWithGoogle).toHaveBeenCalledTimes(1);
  });
});

describe('signing in with an email and a password', () => {
  const login = { name: '', email: 'ana@example.com', password: 'una contraseña larga' };

  it('signs in with the email and the password, and keeps the identifier like Google does', async () => {
    const { dependencies, signInWithPassword, signInWithGoogle, store } = makeDependencies({
      guest: true,
    });
    const { result } = renderHook(() => useSession(dependencies));
    act(() => result.current.requestSignIn());

    await act(() => result.current.signInWithEmail('login', login));

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'una contraseña larga',
    });
    expect(signInWithGoogle).not.toHaveBeenCalled();
    expect(result.current.state).toMatchObject({ status: 'signed_in', token: NEW_TOKEN });
    expect(store.readToken()).toBe(NEW_TOKEN);
    expect(store.isGuest()).toBe(false);
  });

  it('makes the account with the name, the email and the password', async () => {
    const { dependencies, registerWithPassword, signInWithPassword } = makeDependencies();
    const { result } = renderHook(() => useSession(dependencies));

    await act(() => result.current.signInWithEmail('register', { ...login, name: 'Ana Pérez' }));

    expect(registerWithPassword).toHaveBeenCalledWith({
      name: 'Ana Pérez',
      email: 'ana@example.com',
      password: 'una contraseña larga',
    });
    expect(signInWithPassword).not.toHaveBeenCalled();
    expect(result.current.state).toMatchObject({ status: 'signed_in', token: NEW_TOKEN });
  });

  it('shows the error and saves nothing when the email or the password is refused', async () => {
    const { dependencies, signInWithPassword, store } = makeDependencies();
    const refused = new ApiError('http', 'x', 401, 'INVALID_CREDENTIALS');
    signInWithPassword.mockRejectedValue(refused);
    const { result } = renderHook(() => useSession(dependencies));

    await act(() => result.current.signInWithEmail('login', login));

    expect(result.current.state).toEqual({
      status: 'entry',
      signIn: { phase: 'failed', error: refused },
    });
    expect(store.readToken()).toBeNull();
  });

  it('shows the error when the email already has an account', async () => {
    const { dependencies, registerWithPassword } = makeDependencies();
    const taken = new ApiError('http', 'x', 409, 'EMAIL_TAKEN');
    registerWithPassword.mockRejectedValue(taken);
    const { result } = renderHook(() => useSession(dependencies));

    await act(() => result.current.signInWithEmail('register', { ...login, name: 'Ana' }));

    expect(result.current.state).toMatchObject({ signIn: { phase: 'failed', error: taken } });
  });

  it('does not send a second attempt while the first is still working', async () => {
    const { dependencies, signInWithPassword } = makeDependencies();
    let finish: (answer: GoogleLoginAnswer) => void = () => undefined;
    signInWithPassword.mockImplementation(() => new Promise((resolve) => (finish = resolve)));
    const { result } = renderHook(() => useSession(dependencies));

    let first: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.signInWithEmail('login', login);
    });
    await act(() => result.current.signInWithEmail('login', login));
    await act(async () => {
      finish({ token: NEW_TOKEN, expiresAt: 'x', user: profile });
      await first;
    });

    expect(signInWithPassword).toHaveBeenCalledTimes(1);
  });

  it('does nothing yet to recover a password', async () => {
    const { dependencies, signInWithPassword, registerWithPassword } = makeDependencies();
    const { result } = renderHook(() => useSession(dependencies));

    await act(() => result.current.signInWithEmail('recover', login));

    expect(signInWithPassword).not.toHaveBeenCalled();
    expect(registerWithPassword).not.toHaveBeenCalled();
    expect(result.current.state).toEqual({ status: 'entry', signIn: { phase: 'idle' } });
  });
});

describe('guest and sign out', () => {
  it('remembers the guest choice and drops an identifier that could not be checked', () => {
    const { dependencies, store } = makeDependencies();
    const { result } = renderHook(() => useSession(dependencies));

    act(() => result.current.continueAsGuest());

    expect(result.current.state).toEqual({ status: 'guest', remembered: true });
    expect(store.isGuest()).toBe(true);
  });

  it('a guest can go back to the entry, and the guest choice is forgotten', () => {
    const { dependencies, store } = makeDependencies({ guest: true });
    const { result } = renderHook(() => useSession(dependencies));

    act(() => result.current.requestSignIn());

    expect(result.current.state.status).toBe('entry');
    expect(store.isGuest()).toBe(false);
  });

  it('signs out at once and tells the backend, which may fail without keeping the person in', async () => {
    const { dependencies, signOut, store } = makeDependencies({ token: TOKEN });
    signOut.mockRejectedValue(new ApiError('network', 'down'));
    const { result } = renderHook(() => useSession(dependencies));
    await waitFor(() => expect(result.current.state.status).toBe('signed_in'));

    act(() => result.current.signOut());

    expect(result.current.state).toEqual({ status: 'entry', signIn: { phase: 'idle' } });
    expect(store.readToken()).toBeNull();
    expect(store.isGuest()).toBe(false);
    expect(signOut).toHaveBeenCalledWith(TOKEN);
  });

  it('does nothing when there is no session to close', () => {
    const { dependencies, signOut } = makeDependencies({ guest: true });
    const { result } = renderHook(() => useSession(dependencies));

    act(() => result.current.signOut());

    expect(signOut).not.toHaveBeenCalled();
    expect(result.current.state.status).toBe('guest');
  });
});

describe('checkRetryDelayMs', () => {
  it('grows by 3 seconds and stops at 15', () => {
    expect([0, 1, 2, 3, 4, 5, 9].map(checkRetryDelayMs)).toEqual([
      3000, 6000, 9000, 12000, 15000, 15000, 15000,
    ]);
  });
});
