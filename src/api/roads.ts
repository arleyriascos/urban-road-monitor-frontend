import type { SegmentSummaryAnswer, StreetSearchAnswer } from '../types/roads';
import { getJson } from './http';

/** The popup of a segment: the segment, its surroundings and its whole street. */
export function getSegmentSummary(
  segmentId: number,
  options: { radius?: number } = {},
  signal?: AbortSignal,
): Promise<SegmentSummaryAnswer> {
  const query = options.radius === undefined ? '' : `?radius=${options.radius}`;
  return getJson<SegmentSummaryAnswer>(`/api/road-segments/${segmentId}/summary${query}`, {
    signal,
    timeoutMs: 15_000,
  });
}

/** Streets whose name starts with what was typed (or has a later word that does). */
export function searchStreets(
  query: string,
  options: { limit?: number } = {},
  signal?: AbortSignal,
): Promise<StreetSearchAnswer> {
  const params = new URLSearchParams({ q: query });
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  return getJson<StreetSearchAnswer>(`/api/roads/search?${params.toString()}`, {
    signal,
    timeoutMs: 15_000,
  });
}
