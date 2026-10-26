/** 18432 -> "18.432" (Spanish thousands separator, independent of the browser locale). */
export function formatNumber(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 612.4 -> "612,4" */
export function formatDecimal(value: number, digits = 1): string {
  return value.toFixed(digits).replace('.', ',');
}

/** 111.17 -> "111 m", 1234 -> "1,2 km" */
export function formatLength(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${formatDecimal(meters / 1000, 1)} km`;
}

/**
 * 0.875 -> "87,5 %", 0.5 -> "50 %".
 * It never rounds up to 100 %: a confidence of 0.9995 is shown as "99,9 %", because only a
 * value of exactly 1 is certain.
 */
export function formatPercent(fraction: number): string {
  const percent = fraction >= 1 ? 100 : Math.floor(fraction * 1000 + 1e-9) / 10;
  return Number.isInteger(percent) ? `${percent} %` : `${formatDecimal(percent, 1)} %`;
}

/** Route cost compared with the real length: damage 0 -> "×1", damage 6 -> "×7", 4.5 -> "×5,5". */
export function formatCostMultiplier(damageScore: number): string {
  const multiplier = Math.round((1 + damageScore) * 10) / 10;
  return Number.isInteger(multiplier) ? `×${multiplier}` : `×${formatDecimal(multiplier, 1)}`;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** pluralize(1, "bache", "baches") -> "1 bache"; pluralize(54, ...) -> "54 baches" */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}
