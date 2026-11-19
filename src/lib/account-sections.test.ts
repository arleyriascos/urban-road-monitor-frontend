import { describe, expect, it } from 'vitest';
import { ACCOUNT_PATHS, ACCOUNT_SECTIONS, sectionFromPath } from './account-sections';

describe('sectionFromPath', () => {
  it.each(ACCOUNT_SECTIONS)('finds %s from its own address', (section) => {
    expect(sectionFromPath(ACCOUNT_PATHS[section])).toBe(section);
  });

  it('does not mind a slash at the end', () => {
    expect(sectionFromPath('/cuenta/')).toBe('profile');
    expect(sectionFromPath('/cuenta/viajes///')).toBe('trips');
  });

  it.each([
    '/',
    '',
    '/camara',
    '/privacidad',
    '/cuentas',
    '/cuenta/otra',
    '/cuenta/viajes/1',
    '/Cuenta',
  ])('says %j is not the account page', (path) => expect(sectionFromPath(path)).toBeNull());

  it('gives each part a different address', () => {
    expect(new Set(Object.values(ACCOUNT_PATHS)).size).toBe(ACCOUNT_SECTIONS.length);
  });
});
