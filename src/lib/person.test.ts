import { describe, expect, it } from 'vitest';
import { describeRole, initialsOf, safeAvatarUrl } from './person';

describe('describeRole', () => {
  it.each([
    [['usuario'], 'Usuario'],
    [['colaborador', 'usuario'], 'Colaborador'],
    [['administrador', 'colaborador', 'usuario'], 'Administrador'],
    [['usuario', 'administrador'], 'Administrador'],
    [['administrador'], 'Administrador'],
  ])('shows the most powerful role of %j: %s', (roles, label) => {
    expect(describeRole(roles)).toBe(label);
  });

  it('shows "Usuario" when the list is empty', () => {
    expect(describeRole([])).toBe('Usuario');
  });

  it('shows a role it does not know as it comes', () => {
    expect(describeRole(['moderador'])).toBe('moderador');
  });
});

describe('initialsOf', () => {
  it.each([
    ['Ana Pérez', 'AP'],
    ['  ana   maría   pérez gómez ', 'AG'],
    ['Kevin', 'K'],
    ['élida núñez', 'ÉN'],
    ['', '?'],
    ['   ', '?'],
  ])('turns %j into %j', (name, initials) => {
    expect(initialsOf(name)).toBe(initials);
  });
});

describe('safeAvatarUrl', () => {
  it('keeps an https address', () => {
    expect(safeAvatarUrl('https://lh3.googleusercontent.com/a/photo=s96-c')).toBe(
      'https://lh3.googleusercontent.com/a/photo=s96-c',
    );
  });

  it.each([
    null,
    '',
    'http://example.com/a.png',
    'javascript:alert(1)',
    'data:image/png;base64,AA',
    'no url',
  ])('is null for %j', (value) => {
    expect(safeAvatarUrl(value)).toBeNull();
  });
});

describe('describeRole in English', () => {
  it.each([
    [['administrador', 'colaborador', 'usuario'], 'Administrator'],
    [['colaborador', 'usuario'], 'Collaborator'],
    [['usuario'], 'User'],
    [[], 'User'],
    [['moderador'], 'moderador'],
  ])('shows %j as %s', (roles, label) => {
    expect(describeRole(roles, 'en')).toBe(label);
  });
});
