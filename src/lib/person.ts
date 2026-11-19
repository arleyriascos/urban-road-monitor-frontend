import type { Locale } from '../i18n/locale';

/** From the most to the least powerful. The header shows only the first one the person has. */
const ROLE_ORDER = ['administrador', 'colaborador', 'usuario'] as const;

const ROLE_LABELS: Record<Locale, Record<(typeof ROLE_ORDER)[number], string>> = {
  es: { administrador: 'Administrador', colaborador: 'Colaborador', usuario: 'Usuario' },
  en: { administrador: 'Administrator', colaborador: 'Collaborator', usuario: 'User' },
};

/** The role to show for a person: the most powerful one they have, in the language of the app. */
export function describeRole(roles: readonly string[], locale: Locale = 'es'): string {
  const labels = ROLE_LABELS[locale];
  const known = ROLE_ORDER.find((role) => roles.includes(role));
  if (known) return labels[known];
  // A role this version of the page does not know: show it as it comes rather than hide it.
  return roles[0] ?? labels.usuario;
}

/** Up to two capital letters for the circle that stands in for a missing photo. */
export function initialsOf(fullName: string): string {
  const words = fullName
    .trim()
    .split(/\s+/)
    .filter((word) => word !== '');
  if (words.length === 0) return '?';
  const first = words[0]!;
  const last = words.length > 1 ? words[words.length - 1]! : '';
  return (first.charAt(0) + last.charAt(0)).toLocaleUpperCase('es');
}

/** A photo is only used if it is an https address: anything else is shown as initials. */
export function safeAvatarUrl(avatarUrl: string | null): string | null {
  if (!avatarUrl) return null;
  try {
    return new URL(avatarUrl).protocol === 'https:' ? avatarUrl : null;
  } catch {
    return null;
  }
}
