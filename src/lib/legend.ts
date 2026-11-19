import type { NetworkStats } from '../types/map';
import { capitalize, formatDecimal, formatNumber, pluralize } from './format';
import { safeColor } from './html';
import { defaultTexts, type Texts } from './translator';

export interface LegendEntry {
  severity: string;
  label: string;
  color: string;
  count: number;
  countLabel: string;
}

export interface PotholeCounts {
  /** Potholes that still affect the streets: "sin confirmar" plus "confirmado". */
  active: number;
  unconfirmed: number;
  confirmed: number;
  repaired: number;
}

export interface NetworkSummary {
  roads: string;
  length: string;
  potholes: string;
}

/** One legend row per severity, from "sin baches" to the worst. */
export function buildSeverityLegend(stats: NetworkStats): LegendEntry[] {
  return stats.segmentsBySeverity.map((entry) => ({
    severity: entry.severity,
    label: capitalize(entry.severity),
    color: safeColor(entry.color),
    count: entry.count,
    countLabel: formatNumber(entry.count),
  }));
}

export function countPotholes(stats: NetworkStats): PotholeCounts {
  const count = (status: string) =>
    stats.potholesByStatus.find((entry) => entry.status === status)?.count ?? 0;

  const unconfirmed = count('sin confirmar');
  const confirmed = count('confirmado');
  return { active: unconfirmed + confirmed, unconfirmed, confirmed, repaired: count('reparado') };
}

/** Texts of the top bar. */
export function summarizeNetwork(
  stats: NetworkStats,
  { t, locale }: Texts = defaultTexts,
): NetworkSummary {
  return {
    roads: pluralize(stats.roads, t('topbar.roads.one'), t('topbar.roads.other'), locale),
    length: `${formatDecimal(stats.totalLengthKm, 1, locale)} km`,
    potholes: pluralize(
      countPotholes(stats).active,
      t('topbar.potholes.one'),
      t('topbar.potholes.other'),
      locale,
    ),
  };
}
