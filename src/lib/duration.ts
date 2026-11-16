import { formatDecimal, formatNumber } from './format';

/** A time for the person: "1,8 s" from a second up, "120 ms" below. */
export function formatDuration(ms: number): string {
  return ms >= 1000 ? `${formatDecimal(ms / 1000, 1)} s` : `${formatNumber(ms)} ms`;
}
