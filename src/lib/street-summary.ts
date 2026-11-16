import type { StretchSummary } from '../types/roads';
import { capitalize, pluralize } from './format';

/** Adds up the summaries of several parts of a street (for example, two ways of the same name). */
export function combineSummaries(summaries: readonly StretchSummary[]): StretchSummary {
  let worst: StretchSummary['worstSeverity'] = null;
  const total: StretchSummary = {
    segments: 0,
    lengthM: 0,
    visiblePotholes: 0,
    confirmedPotholes: 0,
    damageScore: 0,
    worstSeverity: null,
  };
  for (const summary of summaries) {
    total.segments += summary.segments;
    total.lengthM += summary.lengthM;
    total.visiblePotholes += summary.visiblePotholes;
    total.confirmedPotholes += summary.confirmedPotholes;
    total.damageScore += summary.damageScore;
    if (summary.worstSeverity && (!worst || summary.worstSeverity.weight > worst.weight)) {
      worst = summary.worstSeverity;
    }
  }
  total.worstSeverity = worst;
  return total;
}

/**
 * One line about the potholes of a part of the route, in words:
 * "2 baches a la vista · 1 confirmado · peor: Grave", or "Sin baches a la vista".
 */
export function describeStreetSummary(summary: StretchSummary): string {
  if (summary.visiblePotholes === 0) return 'Sin baches a la vista';
  const seen = `${pluralize(summary.visiblePotholes, 'bache a la vista', 'baches a la vista')}`;
  const confirmed =
    summary.confirmedPotholes === 0
      ? 'ninguno confirmado'
      : `${pluralize(summary.confirmedPotholes, 'confirmado', 'confirmados')}`;
  const worst = summary.worstSeverity ? ` · peor: ${capitalize(summary.worstSeverity.name)}` : '';
  return `${seen} · ${confirmed}${worst}`;
}
