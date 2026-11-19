import type { Locale } from '../i18n/locale';

const TAGS: Record<Locale, string> = { es: 'es-CO', en: 'en-US' };

function formatterFor(locale: Locale): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(TAGS[locale], {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  });
}

const formatters: Record<Locale, Intl.DateTimeFormat> = {
  es: formatterFor('es'),
  en: formatterFor('en'),
};

/** ISO date from the API -> date and time in Colombia, or "—" if it is missing or invalid. */
export function formatDateTime(iso: string | null, locale: Locale = 'es'): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : formatters[locale].format(date);
}
