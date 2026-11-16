import type { SegmentSummaryAnswer } from '../types/roads';

export type SummaryLoader = (
  segmentId: number,
  signal: AbortSignal,
) => Promise<SegmentSummaryAnswer>;

/** The server refreshes the street figures every 10 seconds: a saved answer is as fresh as that. */
export const SUMMARY_TTL_MS = 10_000;

/** The most answers kept: enough to tap around a few streets, never a pile. */
export const SUMMARY_CACHE_SIZE = 50;

/**
 * Remembers the summaries for a few seconds, so tapping the same segment again, or its
 * neighbors, does not ask the server each time. Only good answers are kept.
 */
export function createSummaryCache(
  load: SummaryLoader,
  ttlMs: number = SUMMARY_TTL_MS,
  now: () => number = Date.now,
): SummaryLoader {
  const saved = new Map<number, { at: number; answer: SegmentSummaryAnswer }>();

  return async (segmentId, signal) => {
    const hit = saved.get(segmentId);
    if (hit && now() - hit.at < ttlMs) return hit.answer;
    const answer = await load(segmentId, signal);
    saved.delete(segmentId); // So the newest one is the last in order.
    saved.set(segmentId, { at: now(), answer });
    while (saved.size > SUMMARY_CACHE_SIZE) {
      const oldest = saved.keys().next().value;
      if (oldest === undefined) break;
      saved.delete(oldest);
    }
    return answer;
  };
}
