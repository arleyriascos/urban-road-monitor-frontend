import type { MessageKey, MessageParams } from '../i18n/translate';

/** The three forms of the entry screen: sign in, create an account, recover the password. */
export type AccessView = 'login' | 'register' | 'recover';

export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const NAME_MAX = 150;

/** What is wrong with a field: the key of its text and the values that text needs. */
export interface FieldError {
  key: MessageKey;
  params?: MessageParams;
}

export interface AccessValues {
  name: string;
  email: string;
  password: string;
}

export type AccessErrors = Partial<Record<keyof AccessValues, FieldError>>;

/** Printable ASCII with no spaces: the backend only accepts these in an email. */
const ASCII_NO_SPACES = /^[\x21-\x7e]+$/;
const EMAIL_SHAPE = /^[^@]+@[^@.]+(\.[^@.]+)+$/;

/** How many characters a person sees (an emoji counts once, not twice). */
function length(value: string): number {
  return [...value].length;
}

/**
 * Checks an email as typed: something@domain.tld, with no spaces. Spaces at the ends are not
 * a mistake (a phone keyboard adds them), so they are ignored here and trimmed on sending.
 */
export function checkEmail(value: string): FieldError | null {
  const email = value.trim();
  if (email === '') return { key: 'form.error.emailRequired' };
  if (email.length > EMAIL_MAX || !ASCII_NO_SPACES.test(email) || !EMAIL_SHAPE.test(email)) {
    return { key: 'form.error.emailInvalid' };
  }
  return null;
}

/**
 * Checks a password. Signing in only asks for one: an account made earlier may have a password
 * that today's rules would refuse, and it must still be able to come in. Creating an account
 * asks for the length. Spaces are part of a password, so it is never trimmed.
 */
export function checkPassword(value: string, view: AccessView): FieldError | null {
  if (value === '') return { key: 'form.error.passwordRequired' };
  if (view !== 'register') return null;
  const size = length(value);
  if (size < PASSWORD_MIN)
    return { key: 'form.error.passwordShort', params: { min: PASSWORD_MIN } };
  if (size > PASSWORD_MAX) return { key: 'form.error.passwordLong', params: { max: PASSWORD_MAX } };
  return null;
}

export function checkName(value: string): FieldError | null {
  const name = value.trim();
  if (name === '') return { key: 'form.error.nameRequired' };
  if (length(name) > NAME_MAX) return { key: 'form.error.nameLong', params: { max: NAME_MAX } };
  return null;
}

/** The errors of the fields that the form of a view has; an empty object means it can go. */
export function checkAccess(view: AccessView, values: AccessValues): AccessErrors {
  const errors: AccessErrors = {};
  if (view === 'register') {
    const name = checkName(values.name);
    if (name) errors.name = name;
  }
  const email = checkEmail(values.email);
  if (email) errors.email = email;
  if (view !== 'recover') {
    const password = checkPassword(values.password, view);
    if (password) errors.password = password;
  }
  return errors;
}
