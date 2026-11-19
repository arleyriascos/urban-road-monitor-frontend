import type { Locale } from '../i18n/locale';

/**
 * 18432 -> "18.432" in Spanish and "18,432" in English. The separator comes from the language of
 * the app, not from the browser, so the same number reads the same wherever it is opened.
 */
export function formatNumber(value: number, locale: Locale = 'es'): string {
  const separator = locale === 'en' ? ',' : '.';
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

/** 612.4 -> "612,4" in Spanish and "612.4" in English. */
export function formatDecimal(value: number, digits = 1, locale: Locale = 'es'): string {
  const text = value.toFixed(digits);
  return locale === 'en' ? text : text.replace('.', ',');
}

/** 111.17 -> "111 m", 1234 -> "1,2 km" ("1.2 km" in English) */
export function formatLength(meters: number, locale: Locale = 'es'): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${formatDecimal(meters / 1000, 1, locale)} km`;
}

/**
 * 0.875 -> "87,5 %" ("87.5 %" in English), 0.5 -> "50 %".
 * It never rounds up to 100 %: a confidence of 0.9995 is shown as "99,9 %", because only a
 * value of exactly 1 is certain.
 */
export function formatPercent(fraction: number, locale: Locale = 'es'): string {
  const percent = fraction >= 1 ? 100 : Math.floor(fraction * 1000 + 1e-9) / 10;
  return Number.isInteger(percent) ? `${percent} %` : `${formatDecimal(percent, 1, locale)} %`;
}

/** Route cost compared with the real length: damage 0 -> "×1", damage 6 -> "×7", 4.5 -> "×5,5". */
export function formatCostMultiplier(damageScore: number, locale: Locale = 'es'): string {
  const multiplier = Math.round((1 + damageScore) * 10) / 10;
  return Number.isInteger(multiplier)
    ? `×${multiplier}`
    : `×${formatDecimal(multiplier, 1, locale)}`;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** pluralize(1, "bache", "baches") -> "1 bache"; pluralize(54, ...) -> "54 baches" */
export function pluralize(
  count: number,
  singular: string,
  plural: string,
  locale: Locale = 'es',
): string {
  return `${formatNumber(count, locale)} ${count === 1 ? singular : plural}`;
}
