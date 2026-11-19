import type { Locale } from '../i18n/locale';
import { formatDecimal } from './format';

/** How much of the picture a box covers: "0,4 %" for small ones, "13 %" for big ones. */
export function formatCoverage(ratio: number, locale: Locale = 'es'): string {
  const percent = ratio * 100;
  return `${percent < 10 ? formatDecimal(percent, 1, locale) : formatDecimal(percent, 0, locale)} %`;
}
