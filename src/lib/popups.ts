import type { PotholeProperties, SegmentProperties } from '../types/map';
import type { SegmentSummaryAnswer, StretchSummary } from '../types/roads';
import type { MessageKey } from '../i18n/translate';
import { formatDateTime } from './dates';
import {
  formatCostMultiplier,
  formatDecimal,
  formatLength,
  formatNumber,
  formatPercent,
} from './format';
import { escapeHtml, safeColor } from './html';
import { roadTypeLabel, severityLabel, statusLabel } from './labels';
import { defaultTexts, type Texts } from './translator';

function fact(label: string, value: string): string {
  return `<div class="popup__fact"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
}

function badge(color: string, text: string): string {
  return (
    `<p class="popup__badge"><span class="popup__dot" style="background:${safeColor(color)}">` +
    `</span>${escapeHtml(text)}</p>`
  );
}

/** Content of the popup that opens when a street is tapped. `extra` goes at the end, inside it. */
export function segmentPopupHtml(
  segment: SegmentProperties,
  extra = '',
  texts: Texts = defaultTexts,
): string {
  const { t, locale } = texts;
  return (
    '<div class="popup">' +
    `<p class="popup__title">${escapeHtml(segment.name ?? t('street.unnamed'))}</p>` +
    `<p class="popup__subtitle">${escapeHtml(roadTypeLabel(segment.roadType, texts))}</p>` +
    badge(segment.color, severityLabel(segment.severity, texts)) +
    '<dl class="popup__facts">' +
    fact(t('popup.length'), formatLength(segment.lengthM, locale)) +
    fact(t('popup.direction'), segment.isOneway ? t('popup.oneway') : t('popup.twoway')) +
    fact(t('popup.activePotholes'), formatNumber(segment.activePotholes, locale)) +
    fact(t('popup.routeCost'), formatCostMultiplier(segment.damageScore, locale)) +
    '</dl>' +
    extra +
    '</div>'
  );
}

const STATUS_NOTES: Record<PotholeProperties['status'], MessageKey> = {
  'sin confirmar': 'popup.note.unconfirmed',
  confirmado: 'popup.note.confirmed',
  reparado: 'popup.note.repaired',
};

/** Content of the popup that opens when a pothole is tapped. */
export function potholePopupHtml(pothole: PotholeProperties, texts: Texts = defaultTexts): string {
  const { t, locale } = texts;
  const note = STATUS_NOTES[pothole.status];
  return (
    '<div class="popup">' +
    `<p class="popup__title">${escapeHtml(t('popup.pothole.title', { severity: severityLabel(pothole.severity, texts).toLowerCase() }))}</p>` +
    badge(pothole.color, statusLabel(pothole.status, texts)) +
    `<p class="popup__note">${escapeHtml(note ? t(note) : '')}</p>` +
    '<dl class="popup__facts">' +
    fact(t('popup.pothole.street'), pothole.roadName ?? t('street.unnamed')) +
    fact(t('popup.pothole.confidence'), formatPercent(pothole.confidence, locale)) +
    fact(t('popup.pothole.detections'), formatNumber(pothole.detectionCount, locale)) +
    fact(t('popup.pothole.first'), formatDateTime(pothole.firstDetectedAt, locale)) +
    fact(t('popup.pothole.last'), formatDateTime(pothole.lastDetectedAt, locale)) +
    '</dl></div>'
  );
}

/** Shown in the popup of a segment while its summary is on the way. */
export function summaryLoadingHtml({ t }: Texts = defaultTexts): string {
  return `<p class="popup__note" role="status">${escapeHtml(t('popup.summary.loading'))}</p>`;
}

/** Shown when the summary could not be loaded: the facts of the segment above still hold. */
export function summaryErrorHtml({ t }: Texts = defaultTexts): string {
  return `<p class="popup__note">${escapeHtml(t('popup.summary.error'))}</p>`;
}

type SummaryRow = [label: MessageKey, pick: (summary: StretchSummary, texts: Texts) => string];

const SUMMARY_ROWS: SummaryRow[] = [
  ['popup.summary.segments', (summary, { locale }) => formatNumber(summary.segments, locale)],
  ['popup.summary.length', (summary, { locale }) => formatLength(summary.lengthM, locale)],
  ['popup.summary.visible', (summary, { locale }) => formatNumber(summary.visiblePotholes, locale)],
  [
    'popup.summary.confirmed',
    (summary, { locale }) => formatNumber(summary.confirmedPotholes, locale),
  ],
  ['popup.summary.damage', (summary, { locale }) => formatDecimal(summary.damageScore, 1, locale)],
  [
    'popup.summary.worst',
    (summary, texts) =>
      summary.worstSeverity
        ? severityLabel(summary.worstSeverity.name, texts)
        : texts.t('popup.summary.noWorst'),
  ],
];

/**
 * The part of the segment popup that comes from the backend: where the segment is in its
 * street, and a small table that compares what the stretch around it adds up to with the
 * whole street. Only confirmed potholes count for the damage and the worst severity.
 */
export function segmentSummaryHtml(
  answer: SegmentSummaryAnswer,
  texts: Texts = defaultTexts,
): string {
  const { t, locale } = texts;
  const { segment, window, road } = answer;
  const rows = SUMMARY_ROWS.map(
    ([label, pick]) =>
      `<tr><th scope="row">${escapeHtml(t(label))}</th><td>${escapeHtml(pick(window.summary, texts))}</td>` +
      `<td>${escapeHtml(pick(road.summary, texts))}</td></tr>`,
  ).join('');
  const section = t('popup.summary.section', {
    position: formatNumber(segment.position, locale),
    total: formatNumber(segment.segmentsInRoad, locale),
    street: road.roadName ?? t('street.unnamed'),
  });
  return (
    '<div class="popup__summary">' +
    `<p class="popup__section">${escapeHtml(section)}</p>` +
    '<table class="popup__table">' +
    `<thead><tr><td></td><th scope="col">${escapeHtml(t('popup.summary.around'))}</th><th scope="col">${escapeHtml(t('popup.summary.wholeStreet'))}</th></tr></thead>` +
    `<tbody>${rows}</tbody></table></div>`
  );
}
