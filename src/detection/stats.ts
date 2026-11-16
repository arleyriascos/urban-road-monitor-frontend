/** The middle value of the list (the average of the two in the middle when the count is even). */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** The average of the list, or null when it is empty. */
export function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

/**
 * How many times per second something happened, from the moments (in milliseconds) it
 * happened. It needs at least two moments and some time between the first and the last.
 */
export function ratePerSecond(momentsMs: readonly number[]): number | null {
  if (momentsMs.length < 2) return null;
  const elapsed = momentsMs[momentsMs.length - 1] - momentsMs[0];
  if (elapsed <= 0) return null;
  return ((momentsMs.length - 1) * 1000) / elapsed;
}
