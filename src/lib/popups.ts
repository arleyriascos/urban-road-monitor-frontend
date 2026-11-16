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

/** Content of the popup that opens when a street is tapped. `extra` goes at the end, inside it. */
export function segmentPopupHtml(segment: SegmentProperties, extra = ''): string {
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
    '</dl>' +
    extra +
    '</div>'
  );
}

const STATUS_NOTES: Record<PotholeProperties['status'], string> = {
  'sin confirmar':
    'Aún se vio una sola vez: no cambia el daño de la calle ni las rutas hasta que otra persona lo confirme.',
  confirmado:
    'Lo vieron al menos dos veces: cuenta para el daño de la calle y las rutas lo evitan.',
  reparado: 'Ya fue reparado: no cuenta para el daño ni para las rutas.',
};

/** Content of the popup that opens when a pothole is tapped. */
export function potholePopupHtml(pothole: PotholeProperties): string {
  return (
    '<div class="popup">' +
    `<p class="popup__title">Bache ${escapeHtml(pothole.severity)}</p>` +
    badge(pothole.color, pothole.status) +
    `<p class="popup__note">${escapeHtml(STATUS_NOTES[pothole.status] ?? '')}</p>` +
    '<dl class="popup__facts">' +
    fact('Calle', pothole.roadName ?? UNNAMED_STREET) +
    fact('Confianza', formatPercent(pothole.confidence)) +
    fact('Detecciones', formatNumber(pothole.detectionCount)) +
    fact('Primera vez', formatDateTime(pothole.firstDetectedAt)) +
    fact('Última vez', formatDateTime(pothole.lastDetectedAt)) +
    '</dl></div>'
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

type SummaryRow = [label: string, pick: (summary: StretchSummary) => string];

const SUMMARY_ROWS: SummaryRow[] = [
  ['Tramos', (summary) => formatNumber(summary.segments)],
  ['Longitud', (summary) => formatLength(summary.lengthM)],
  ['Baches a la vista', (summary) => formatNumber(summary.visiblePotholes)],
  ['Confirmados', (summary) => formatNumber(summary.confirmedPotholes)],
  ['Daño', (summary) => formatDecimal(summary.damageScore, 1)],
  [
    'Peor gravedad',
    (summary) => (summary.worstSeverity ? capitalize(summary.worstSeverity.name) : 'Ninguna'),
  ],
];

/**
 * The part of the segment popup that comes from the backend: where the segment is in its
 * street, and a small table that compares what the stretch around it adds up to with the
 * whole street. Only confirmed potholes count for the damage and the worst severity.
 */
export function segmentSummaryHtml(answer: SegmentSummaryAnswer): string {
  const { segment, window, road } = answer;
  const rows = SUMMARY_ROWS.map(
    ([label, pick]) =>
      `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(pick(window.summary))}</td>` +
      `<td>${escapeHtml(pick(road.summary))}</td></tr>`,
  ).join('');
  return (
    '<div class="popup__summary">' +
    `<p class="popup__section">Tramo ${formatNumber(segment.position)} de ${formatNumber(segment.segmentsInRoad)} de ${escapeHtml(road.roadName ?? UNNAMED_STREET)}</p>` +
    '<table class="popup__table">' +
    `<thead><tr><td></td><th scope="col">Alrededor</th><th scope="col">Toda la calle</th></tr></thead>` +
    `<tbody>${rows}</tbody></table></div>`
  );
}
