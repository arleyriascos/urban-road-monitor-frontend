/** The parts of the account page, in the order of the menu. */
export const ACCOUNT_SECTIONS = ['profile', 'trips', 'settings'] as const;

export type AccountSection = (typeof ACCOUNT_SECTIONS)[number];

/** The address of each part. The host rewrites every path to the app, so no router is needed. */
export const ACCOUNT_PATHS: Record<AccountSection, string> = {
  profile: '/cuenta',
  trips: '/cuenta/viajes',
  settings: '/cuenta/configuraciones',
};

/** The part an address shows, or null when the address is not one of the account page. */
export function sectionFromPath(pathname: string): AccountSection | null {
  const clean = pathname.replace(/\/+$/, '');
  return ACCOUNT_SECTIONS.find((section) => ACCOUNT_PATHS[section] === clean) ?? null;
}
