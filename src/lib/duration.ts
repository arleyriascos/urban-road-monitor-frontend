import type { Locale } from '../i18n/locale';
import { formatDecimal, formatNumber } from './format';

/** A time for the person: "1,8 s" from a second up, "120 ms" below ("1.8 s" in English). */
export function formatDuration(ms: number, locale: Locale = 'es'): string {
  return ms >= 1000 ? `${formatDecimal(ms / 1000, 1, locale)} s` : `${formatNumber(ms, locale)} ms`;
}
