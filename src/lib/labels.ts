import type { MessageKey } from '../i18n/translate';
import { capitalize } from './format';
import { defaultTexts, type Texts } from './translator';

/**
 * The backend names severities, pothole states and road types in Spanish. These are the texts
 * the app shows for each name it knows; a name it does not know is shown as it came.
 */
const SEVERITY_KEYS: Record<string, MessageKey> = {
  'sin baches': 'severity.none',
  leve: 'severity.leve',
  moderado: 'severity.moderado',
  grave: 'severity.grave',
};

const STATUS_KEYS: Record<string, MessageKey> = {
  'sin confirmar': 'status.unconfirmed',
  confirmado: 'status.confirmed',
  reparado: 'status.repaired',
};

const ROAD_TYPE_KEYS: Record<string, MessageKey> = {
  'Vía troncal': 'roadType.trunk',
  'Vía principal': 'roadType.primary',
  'Vía secundaria': 'roadType.secondary',
  'Vía terciaria': 'roadType.tertiary',
  'Calle residencial': 'roadType.residential',
  'Calle de tráfico calmado': 'roadType.livingStreet',
  'Vía de servicio': 'roadType.service',
  'Vía sin clasificar': 'roadType.unclassified',
};

function label(keys: Record<string, MessageKey>, name: string, { t }: Texts): string {
  const key = Object.hasOwn(keys, name) ? keys[name] : undefined;
  return key ? t(key) : capitalize(name);
}

/** "grave" -> "Grave" / "Severe", "sin baches" -> "Sin baches" / "No potholes". */
export function severityLabel(name: string, texts: Texts = defaultTexts): string {
  return label(SEVERITY_KEYS, name, texts);
}

/** "sin confirmar" -> "Sin confirmar" / "Unconfirmed". */
export function statusLabel(name: string, texts: Texts = defaultTexts): string {
  return label(STATUS_KEYS, name, texts);
}

/** "Vía terciaria" -> "Vía terciaria" / "Tertiary road". An unknown type is shown as it came. */
export function roadTypeLabel(name: string, { t }: Texts = defaultTexts): string {
  const key = Object.hasOwn(ROAD_TYPE_KEYS, name) ? ROAD_TYPE_KEYS[name] : undefined;
  return key ? t(key) : name;
}
