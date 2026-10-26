import type { PotholeProperties, SegmentProperties } from '../types/map';
import { formatDateTime } from './dates';
import {
  capitalize,
  formatCostMultiplier,
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
