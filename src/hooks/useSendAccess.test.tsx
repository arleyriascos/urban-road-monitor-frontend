import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import type { AccountProfile } from '../types/auth';
import { ACCESS_RETRY_MS, useSendAccess, type SendAccessDependencies } from './useSendAccess';

const TOKEN = 'a'.repeat(43);

const profile = (permissions: string[]): AccountProfile => ({
  id: 'u1',
  email: 'ana@example.com',
  fullName: 'Ana',
  avatarUrl: null,
  roles: ['colaborador'],
  permissions,
});

function setup(token: string | null, getMe: SendAccessDependencies['getMe']) {
  return renderHook(() => useSendAccess({ store: { readToken: () => token }, getMe }));
}

afterEach(() => vi.useRealTimers());

describe('useSendAccess', () => {
  it('is a guest without a session and asks nothing', () => {
    const getMe = vi.fn();
    const { result } = setup(null, getMe);
    expect(result.current).toEqual({ status: 'guest' });
    expect(getMe).not.toHaveBeenCalled();
  });

  it('checks the session and allows a collaborator', async () => {
    const getMe = vi.fn(async () => profile(['detections.create']));
    const { result } = setup(TOKEN, getMe);
    expect(result.current).toEqual({ status: 'checking' });
    await waitFor(() =>
      expect(result.current).toEqual({ status: 'allowed', token: TOKEN, userId: 'u1' }),
    );
    expect(getMe).toHaveBeenCalledWith(TOKEN, expect.any(AbortSignal));
  });

  it('does not allow an account without the permission', async () => {
    const { result } = setup(TOKEN, async () => profile(['map.view']));
    await waitFor(() => expect(result.current.status).toBe('no_permission'));
  });

  it('says the session is over on a 401', async () => {
    const { result } = setup(TOKEN, async () => {
      throw new ApiError('http', 'x', 401, 'UNAUTHORIZED');
    });
    await waitFor(() => expect(result.current.status).toBe('session_over'));
  });

  it('asks again after a while when the backend does not answer', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const getMe = vi
      .fn<SendAccessDependencies['getMe']>()
      .mockRejectedValueOnce(new ApiError('network', 'down'))
      .mockResolvedValue(profile(['detections.create']));
    const { result } = setup(TOKEN, getMe);
    await waitFor(() => expect(result.current.status).toBe('unreachable'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(ACCESS_RETRY_MS);
    });
    await waitFor(() => expect(result.current.status).toBe('allowed'));
    expect(getMe).toHaveBeenCalledTimes(2);
  });

  it('does not treat a 503 as a closed session', async () => {
    const { result } = setup(TOKEN, async () => {
      throw new ApiError('http', 'x', 503, 'DATABASE_UNAVAILABLE');
    });
    await waitFor(() => expect(result.current.status).toBe('unreachable'));
  });
});
