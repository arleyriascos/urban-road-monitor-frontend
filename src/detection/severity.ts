import type { PotholeSeverity } from '../types/map';

/**
 * Where one severity ends and the next begins, as the share of the picture the box covers.
 * They are the first values: the real tests in the street (stage 5) tune them. The server
 * has the last word, because it also counts how many people reported the pothole.
 */
export const SEVERITY_LIMITS = {
  /** Below this, a "leve" pothole. */
  leve: 0.01,
  /** Below this, a "moderado" one; from here up, "grave". */
  moderado: 0.04,
} as const;

/** The severity that goes with the share of the picture a box covers. */
export function severityOf(ratio: number): PotholeSeverity {
  if (ratio < SEVERITY_LIMITS.leve) return 'leve';
  if (ratio < SEVERITY_LIMITS.moderado) return 'moderado';
  return 'grave';
}
