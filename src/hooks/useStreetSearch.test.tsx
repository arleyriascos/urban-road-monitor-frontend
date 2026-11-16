import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import type { StreetMatch, StreetSearchAnswer } from '../types/roads';
import { useStreetSearch, type StreetSearchDependencies } from './useStreetSearch';

const street = (name: string): StreetMatch => ({
  name,
  roadIds: [1],
  segments: 3,
  center: { latitude: 1.2, longitude: -77.3 },
  bounds: { minLatitude: 1.2, maxLatitude: 1.21, minLongitude: -77.3, maxLongitude: -77.29 },
});

const answer = (query: string, ...names: string[]): StreetSearchAnswer => ({
  query,
  streets: names.map(street),
});

type Search = StreetSearchDependencies['search'];

function setup(search: Search) {
  return renderHook(() => useStreetSearch({ search, debounceMs: 300 }));
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

async function type(result: { current: ReturnType<typeof useStreetSearch> }, text: string) {
  await act(async () => result.current.setText(text));
}
async function pass(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe('useStreetSearch', () => {
  it('is idle until there is enough text, and asks nothing', async () => {
    const search = vi.fn<Search>();
    const { result } = setup(search);
    expect(result.current.state).toEqual({ status: 'idle' });
    await type(result, 'c');
    await pass(1000);
    expect(result.current.state).toEqual({ status: 'idle' });
    expect(search).not.toHaveBeenCalled();
  });

  it('waits until the person stops typing, then shows the streets', async () => {
    const search = vi.fn<Search>(async (q) => answer(q, 'Calle 18'));
    const { result } = setup(search);

    await type(result, 'ca');
    expect(result.current.state).toEqual({ status: 'loading' });
    await pass(299);
    expect(search).not.toHaveBeenCalled();
    await pass(1);

    expect(search).toHaveBeenCalledWith('ca', { limit: 8 }, expect.any(AbortSignal));
    expect(result.current.state).toEqual({ status: 'results', streets: [street('Calle 18')] });
  });

  it('asks only once for text typed quickly, and with the clean text', async () => {
    const search = vi.fn<Search>(async (q) => answer(q, 'Calle 18'));
    const { result } = setup(search);

    await type(result, 'ca');
    await pass(100);
    await type(result, 'cal');
    await pass(100);
    await type(result, '  cal   18 ');
    await pass(300);

    expect(search).toHaveBeenCalledTimes(1);
    expect(search.mock.calls[0][0]).toBe('cal 18');
  });

  it('cancels the search that was left behind and never shows its answer', async () => {
    let first: ((value: StreetSearchAnswer) => void) | undefined;
    const signals: AbortSignal[] = [];
    const search = vi.fn<Search>((q, _options, signal) => {
      signals.push(signal);
      if (q === 'ca') return new Promise((resolve) => (first = resolve));
      return Promise.resolve(answer(q, 'Carrera 24'));
    });
    const { result } = setup(search);

    await type(result, 'ca');
    await pass(300);
    await type(result, 'car');
    expect(signals[0].aborted).toBe(true);
    await pass(300);

    first?.(answer('ca', 'Calle 18'));
    await pass(0);
    expect(result.current.state).toEqual({ status: 'results', streets: [street('Carrera 24')] });
  });

  it('says when nothing matches', async () => {
    const { result } = setup(async (q) => answer(q));
    await type(result, 'zz');
    await pass(300);
    expect(result.current.state).toEqual({ status: 'empty' });
  });

  it('shows the error of a failed search and asks again on retry', async () => {
    const search = vi
      .fn<Search>()
      .mockRejectedValueOnce(new ApiError('network', 'down'))
      .mockImplementation(async (q) => answer(q, 'Calle 18'));
    const { result } = setup(search);

    await type(result, 'ca');
    await pass(300);
    expect(result.current.state).toMatchObject({ status: 'error', error: { kind: 'network' } });

    await act(async () => result.current.retry());
    await pass(300);
    expect(result.current.state.status).toBe('results');
    expect(search).toHaveBeenCalledTimes(2);
  });

  it('turns a failure that is not an ApiError into a network error', async () => {
    const { result } = setup(async () => {
      throw new TypeError('boom');
    });
    await type(result, 'ca');
    await pass(300);
    expect(result.current.state).toMatchObject({ status: 'error', error: { kind: 'network' } });
  });

  it('goes back to idle and drops the answer when the box is cleared', async () => {
    const { result } = setup(async (q) => answer(q, 'Calle 18'));
    await type(result, 'ca');
    await pass(300);
    await act(async () => result.current.clear());
    expect(result.current.text).toBe('');
    expect(result.current.state).toEqual({ status: 'idle' });
  });

  it('cancels its search when the screen goes away', async () => {
    let signal: AbortSignal | undefined;
    const { result, unmount } = setup((_q, _o, abort) => {
      signal = abort;
      return new Promise(() => undefined);
    });
    await type(result, 'ca');
    await pass(300);
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
