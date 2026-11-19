import { describe, expect, it } from 'vitest';
import {
  EMAIL_MAX,
  NAME_MAX,
  PASSWORD_MAX,
  PASSWORD_MIN,
  checkAccess,
  checkEmail,
  checkName,
  checkPassword,
} from './email-auth';

describe('checkEmail', () => {
  it.each([
    'ana@example.com',
    'arley.riascos@campusucc.edu.co',
    'a+tag@sub.domain.org',
    'x_y-z@mail.co',
    '  ana@example.com  ',
    'ana@example.com\n',
    'A@B.CO',
  ])('accepts %j', (email) => {
    expect(checkEmail(email)).toBeNull();
  });

  it.each([
    'ana',
    'ana@',
    '@example.com',
    'ana@example',
    'ana@@example.com',
    'ana@exam ple.com',
    'an a@example.com',
    'ana@.com',
    'ana@example..com',
    'ana@example.',
    'ana@example.com.',
    'año@example.com',
    'ana@ejemplo.cóm',
    'ana@exa\nmple.com',
  ])('refuses %j as not an email', (email) => {
    expect(checkEmail(email)).toEqual({ key: 'form.error.emailInvalid' });
  });

  it('says it is missing when empty or only spaces', () => {
    expect(checkEmail('')).toEqual({ key: 'form.error.emailRequired' });
    expect(checkEmail('   ')).toEqual({ key: 'form.error.emailRequired' });
  });

  it('refuses an email longer than the limit, and accepts one of exactly the limit', () => {
    const domain = '@example.com';
    const exact = 'a'.repeat(EMAIL_MAX - domain.length) + domain;
    expect(exact).toHaveLength(EMAIL_MAX);
    expect(checkEmail(exact)).toBeNull();
    expect(checkEmail('a' + exact)).toEqual({ key: 'form.error.emailInvalid' });
  });
});

describe('checkPassword', () => {
  it('asks only for a password when signing in, whatever it is', () => {
    expect(checkPassword('x', 'login')).toBeNull();
    expect(checkPassword('  ', 'login')).toBeNull();
    expect(checkPassword('', 'login')).toEqual({ key: 'form.error.passwordRequired' });
  });

  it('asks for the length when creating an account', () => {
    expect(checkPassword('', 'register')).toEqual({ key: 'form.error.passwordRequired' });
    expect(checkPassword('1234567', 'register')).toEqual({
      key: 'form.error.passwordShort',
      params: { min: PASSWORD_MIN },
    });
    expect(checkPassword('12345678', 'register')).toBeNull();
    expect(checkPassword('a'.repeat(PASSWORD_MAX), 'register')).toBeNull();
    expect(checkPassword('a'.repeat(PASSWORD_MAX + 1), 'register')).toEqual({
      key: 'form.error.passwordLong',
      params: { max: PASSWORD_MAX },
    });
  });

  it('counts what a person sees: eight emojis are eight characters', () => {
    expect(checkPassword('😀'.repeat(8), 'register')).toBeNull();
    expect(checkPassword('😀'.repeat(7), 'register')).toMatchObject({
      key: 'form.error.passwordShort',
    });
  });

  it('does not trim: spaces are part of the password', () => {
    expect(checkPassword('        ', 'register')).toBeNull();
  });
});

describe('checkName', () => {
  it('asks for a name, ignoring the spaces at the ends', () => {
    expect(checkName('')).toEqual({ key: 'form.error.nameRequired' });
    expect(checkName('   ')).toEqual({ key: 'form.error.nameRequired' });
    expect(checkName(' Ana ')).toBeNull();
  });

  it('refuses a name over the limit and accepts one of exactly the limit', () => {
    expect(checkName('a'.repeat(NAME_MAX))).toBeNull();
    expect(checkName('a'.repeat(NAME_MAX + 1))).toEqual({
      key: 'form.error.nameLong',
      params: { max: NAME_MAX },
    });
  });
});

describe('checkAccess', () => {
  const good = { name: 'Ana', email: 'ana@example.com', password: 'secret-123' };

  it('has no errors when the form of each view is right', () => {
    expect(checkAccess('login', good)).toEqual({});
    expect(checkAccess('register', good)).toEqual({});
    expect(checkAccess('recover', good)).toEqual({});
  });

  it('checks only the fields that the form of the view has', () => {
    const empty = { name: '', email: '', password: '' };

    expect(Object.keys(checkAccess('login', empty))).toEqual(['email', 'password']);
    expect(Object.keys(checkAccess('register', empty))).toEqual(['name', 'email', 'password']);
    expect(Object.keys(checkAccess('recover', empty))).toEqual(['email']);
  });

  it('applies the length of the password only when creating an account', () => {
    const short = { ...good, password: 'abc' };
    expect(checkAccess('login', short)).toEqual({});
    expect(checkAccess('register', short).password?.key).toBe('form.error.passwordShort');
  });
});

describe('checkEmail with generated emails', () => {
  // A small generator with a fixed seed, so a failure can be repeated.
  function random(seed: number) {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }
  const pick = (next: () => number, chars: string, size: number) =>
    Array.from({ length: size }, () => chars[Math.floor(next() * chars.length)]).join('');

  it('accepts every email made of a name, an @, a domain and a ending', () => {
    const next = random(7);
    for (let i = 0; i < 300; i++) {
      const email = `${pick(next, 'abcxyz019._+-', 1 + Math.floor(next() * 12))}@${pick(next, 'abcxyz09-', 1 + Math.floor(next() * 8))}.${pick(next, 'abcz', 2 + Math.floor(next() * 3))}`;
      expect(checkEmail(email), email).toBeNull();
    }
  });

  it('refuses every email with a space, a second @ or no @ inside', () => {
    const next = random(11);
    for (let i = 0; i < 300; i++) {
      const local = pick(next, 'abcxyz09', 3 + Math.floor(next() * 5));
      const domain = `${pick(next, 'abcxyz', 3)}.com`;
      for (const bad of [
        `${local} x@${domain}`,
        `${local}@@${domain}`,
        `${local}${domain}`,
        `${local}@${domain} x`,
      ]) {
        expect(checkEmail(bad), bad).not.toBeNull();
      }
    }
  });
});
