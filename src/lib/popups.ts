import type { PotholeProperties, SegmentProperties } from '../types/map';
import type { SegmentSummaryAnswer, StretchSummary } from '../types/roads';
import { formatDateTime } from './dates';
import {
  capitalize,
  formatCostMultiplier,
  formatDecimal,
  formatLength,
  formatNumber,
  formatPercent,
  pluralize,
} from './format';
import { escapeHtml, safeColor } from './html';

const UNNAMED_STREET = 'Calle sin nombre';

function fact(label: string, value: string): string {
  return `<div class="popup__fact"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
}

function badge(color: string, text: string): string {
  return (
    `<p class="popup__badge"><span class="popup__dot" style="background:${safeColor(color)}">` +
    `</span>${escapeHtml(capitalize(text))}</p>`
  );
}

/** Content of the popup that opens when a street is tapped. */
export function segmentPopupHtml(segment: SegmentProperties): string {
  return (
    '<div class="popup">' +
    `<p class="popup__title">${escapeHtml(segment.name ?? UNNAMED_STREET)}</p>` +
    `<p class="popup__subtitle">${escapeHtml(segment.roadType)}</p>` +
    badge(segment.color, segment.severity) +
    '<dl class="popup__facts">' +
    fact('Longitud', formatLength(segment.lengthM)) +
    fact('Sentido', segment.isOneway ? 'Un solo sentido' : 'Doble sentido') +
    fact('Baches activos', formatNumber(segment.activePotholes)) +
    fact('Costo de ruta', formatCostMultiplier(segment.damageScore)) +
    '</dl></div>'
  );
}

/** Content of the popup that opens when a pothole is tapped. */
export function potholePopupHtml(pothole: PotholeProperties): string {
  return (
    '<div class="popup">' +
    `<p class="popup__title">Bache ${escapeHtml(pothole.severity)}</p>` +
    badge(pothole.color, pothole.status) +
    '<dl class="popup__facts">' +
    fact('Calle', pothole.roadName ?? UNNAMED_STREET) +
    fact('Confianza', formatPercent(pothole.confidence)) +
    fact('Detecciones', formatNumber(pothole.detectionCount)) +
    fact('Primera vez', formatDateTime(pothole.firstDetectedAt)) +
    fact('Última vez', formatDateTime(pothole.lastDetectedAt)) +
    '</dl></div>'
  );
}

/** What a stretch of street adds up to, as the rows of a popup. */
function stretchFacts(summary: StretchSummary): string {
  return (
    '<dl class="popup__facts">' +
    fact('Tramos', formatNumber(summary.segments)) +
    fact('Longitud', formatLength(summary.lengthM)) +
    fact('Baches a la vista', formatNumber(summary.visiblePotholes)) +
    fact('Baches confirmados', formatNumber(summary.confirmedPotholes)) +
    fact('Daño', formatDecimal(summary.damageScore, 1)) +
    fact(
      'Peor gravedad',
      summary.worstSeverity ? capitalize(summary.worstSeverity.name) : 'Ninguna confirmada',
    ) +
    '</dl>'
  );
}

/** Shown in the popup of a segment while its summary is on the way. */
export function summaryLoadingHtml(): string {
  return '<p class="popup__note" role="status">Cargando el resumen de la calle…</p>';
}

/** Shown when the summary could not be loaded: the facts of the segment above still hold. */
export function summaryErrorHtml(): string {
  return '<p class="popup__note">No se pudo cargar el resumen de la calle. Toca el tramo otra vez para reintentar.</p>';
}

/**
 * The part of the segment popup that comes from the backend: where the segment is in its street,
 * what the stretch around it adds up to, and the whole street. Only confirmed potholes count
 * for the damage and the worst severity.
 */
export function segmentSummaryHtml(answer: SegmentSummaryAnswer): string {
  const { segment, window, road } = answer;
  const around = window.summary.segments;
  return (
    '<div class="popup__summary">' +
    `<p class="popup__section">Tramo ${formatNumber(segment.position)} de ${formatNumber(segment.segmentsInRoad)} de esta calle</p>` +
    `<p class="popup__section">Alrededor (${pluralize(around, 'tramo', 'tramos')})</p>` +
    stretchFacts(window.summary) +
    `<p class="popup__section">${escapeHtml(road.roadName ?? UNNAMED_STREET)}, completa</p>` +
    stretchFacts(road.summary) +
    '</div>'
  );
}
