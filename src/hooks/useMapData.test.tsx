import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import { getNetworkStats, getPotholes, getRoadSegments } from '../api/map';
import { potholesFixture, segmentsFixture, statsFixture } from '../test/fixtures';
import { SLOW_REQUEST_MS, useMapData } from './useMapData';

vi.mock('../api/map');

beforeEach(() => {
  vi.mocked(getRoadSegments).mockResolvedValue(segmentsFixture);
  vi.mocked(getPotholes).mockResolvedValue(potholesFixture);
  vi.mocked(getNetworkStats).mockResolvedValue(statsFixture);
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe('useMapData', () => {
  it('starts loading and then gives the three responses together', async () => {
    const { result } = renderHook(() => useMapData());
    expect(result.current.state).toEqual({ status: 'loading', slow: false });

    await waitFor(() => expect(result.current.state.status).toBe('success'));

    const state = result.current.state;
    if (state.status !== 'success') throw new Error('expected success');
    expect(state.data).toEqual({
      segments: segmentsFixture,
      potholes: potholesFixture,
      stats: statsFixture,
    });
  });

  it('asks for the repaired potholes too, so the screen can filter them', async () => {
    renderHook(() => useMapData());
    await waitFor(() => expect(getPotholes).toHaveBeenCalled());
    expect(vi.mocked(getPotholes).mock.calls[0][0]).toEqual({ includeRepaired: true });
  });

  it('shows the error when any request fails', async () => {
    vi.mocked(getNetworkStats).mockRejectedValue(new ApiError('http', 'Boom', 500));
    const { result } = renderHook(() => useMapData());

    await waitFor(() => expect(result.current.state.status).toBe('error'));

    const state = result.current.state;
    if (state.status !== 'error') throw new Error('expected error');
    expect(state.error).toMatchObject({ kind: 'http', status: 500 });
  });

  it('wraps an unexpected error in an ApiError', async () => {
    vi.mocked(getRoadSegments).mockRejectedValue(new Error('surprise'));
    const { result } = renderHook(() => useMapData());

    await waitFor(() => expect(result.current.state.status).toBe('error'));

    const state = result.current.state;
    if (state.status !== 'error') throw new Error('expected error');
    expect(state.error).toBeInstanceOf(ApiError);
    expect(state.error.kind).toBe('network');
  });

  it('loads again when retry is called', async () => {
    vi.mocked(getRoadSegments).mockRejectedValueOnce(new ApiError('network', 'down'));
    const { result } = renderHook(() => useMapData());
    await waitFor(() => expect(result.current.state.status).toBe('error'));

    act(() => {
      result.current.retry();
    });
    expect(result.current.state).toEqual({ status: 'loading', slow: false });

    await waitFor(() => expect(result.current.state.status).toBe('success'));
    expect(getRoadSegments).toHaveBeenCalledTimes(2);
  });

  it('cancels the requests when the screen goes away', async () => {
    const { unmount } = renderHook(() => useMapData());
    await waitFor(() => expect(getRoadSegments).toHaveBeenCalled());
    const signal = vi.mocked(getRoadSegments).mock.calls[0][0];

    unmount();

    expect(signal?.aborted).toBe(true);
  });

  it('marks a request as slow after 5 seconds, so the UI can explain why', () => {
    vi.useFakeTimers();
    vi.mocked(getRoadSegments).mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => useMapData());

    act(() => {
      vi.advanceTimersByTime(SLOW_REQUEST_MS - 1);
    });
    expect(result.current.state).toEqual({ status: 'loading', slow: false });

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.state).toEqual({ status: 'loading', slow: true });
  });
});
