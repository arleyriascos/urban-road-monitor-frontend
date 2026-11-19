/**
 * How long a trip lasted, in whole minutes, or null while it is open (or its dates are wrong).
 * A trip shorter than a minute counts as one, so it never shows "0 min".
 */
export function tripMinutes(startedAt: string, endedAt: string | null): number | null {
  if (endedAt === null) return null;
  const start = Date.parse(startedAt);
  const end = Date.parse(endedAt);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.max(1, Math.round((end - start) / 60_000));
}

/** 5 -> "5 min", 65 -> "1 h 5 min", 120 -> "2 h". The units are the same in both languages. */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
