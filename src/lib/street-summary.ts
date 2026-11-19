import type { StretchSummary } from '../types/roads';
import { pluralize } from './format';
import { severityLabel } from './labels';
import { defaultTexts, type Texts } from './translator';

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
export function describeStreetSummary(
  summary: StretchSummary,
  texts: Texts = defaultTexts,
): string {
  const { t, locale } = texts;
  if (summary.visiblePotholes === 0) return t('streetSummary.none');
  const seen = pluralize(
    summary.visiblePotholes,
    t('streetSummary.seen.one'),
    t('streetSummary.seen.other'),
    locale,
  );
  const confirmed =
    summary.confirmedPotholes === 0
      ? t('streetSummary.noneConfirmed')
      : pluralize(
          summary.confirmedPotholes,
          t('streetSummary.confirmed.one'),
          t('streetSummary.confirmed.other'),
          locale,
        );
  const worst = summary.worstSeverity
    ? ` · ${t('streetSummary.worst', { severity: severityLabel(summary.worstSeverity.name, texts) })}`
    : '';
  return `${seen} · ${confirmed}${worst}`;
}
