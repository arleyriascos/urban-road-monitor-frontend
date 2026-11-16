import { describe, expect, it, vi } from 'vitest';
import type { SegmentSummaryAnswer } from '../types/roads';
import {
  createSummaryCache,
  SUMMARY_CACHE_SIZE,
  SUMMARY_TTL_MS,
  type SummaryLoader,
} from './summary-cache';

const answerFor = (id: number) => ({ segment: { id } }) as unknown as SegmentSummaryAnswer;
const signal = new AbortController().signal;

describe('createSummaryCache', () => {
  it('asks the server the first time and remembers the answer for 10 seconds', async () => {
    let time = 0;
    const load = vi.fn(async (id: number) => answerFor(id));
    const get = createSummaryCache(load, SUMMARY_TTL_MS, () => time);

    await get(1, signal);
    time = SUMMARY_TTL_MS - 1;
    expect(await get(1, signal)).toEqual(answerFor(1));
    expect(load).toHaveBeenCalledTimes(1);

    time = SUMMARY_TTL_MS;
    await get(1, signal);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('keeps each segment apart', async () => {
    const load = vi.fn(async (id: number) => answerFor(id));
    const get = createSummaryCache(load);
    await get(1, signal);
    await get(2, signal);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('does not keep a failed answer', async () => {
    const load = vi
      .fn<(id: number) => Promise<SegmentSummaryAnswer>>()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValue(answerFor(1));
    const get = createSummaryCache(load);
    await expect(get(1, signal)).rejects.toThrow('down');
    expect(await get(1, signal)).toEqual(answerFor(1));
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('passes the signal on, so closing the popup cancels the request', async () => {
    const load = vi.fn<SummaryLoader>(async (id) => answerFor(id));
    const get = createSummaryCache(load);
    await get(1, signal);
    expect(load).toHaveBeenCalledWith(1, signal);
  });

  it('forgets the oldest answers when it has too many', async () => {
    const load = vi.fn(async (id: number) => answerFor(id));
    const get = createSummaryCache(load);
    for (let id = 1; id <= SUMMARY_CACHE_SIZE + 1; id++) await get(id, signal);
    load.mockClear();
    await get(SUMMARY_CACHE_SIZE + 1, signal); // Still remembered.
    expect(load).not.toHaveBeenCalled();
    await get(1, signal); // The oldest was forgotten.
    expect(load).toHaveBeenCalledTimes(1);
  });
});
