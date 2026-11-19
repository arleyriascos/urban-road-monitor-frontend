import type { MessageKey } from './messages.es';

/** The same texts as `messages.es.ts`, in English: the same keys and the same {placeholders}. */
export const en: Record<MessageKey, string> = {
  'language.label': 'Language',
  'language.name.es': 'Español',
  'language.name.en': 'English',
  'form.error.emailRequired': 'Enter your email.',
  'form.error.emailInvalid': 'Check the email: it should look like name@example.com.',
  'form.error.passwordRequired': 'Enter your password.',
  'form.error.passwordShort': 'Use at least {min} characters.',
  'form.error.passwordLong': 'Use at most {max} characters.',
  'form.error.nameRequired': 'Enter your name.',
  'form.error.nameLong': 'Use at most {max} characters.',
  'form.password.show': 'Show password',
  'form.password.hide': 'Hide password',
  'form.name.label': 'Full name',
  'form.email.label': 'Email',
  'form.email.placeholder': 'you@example.com',
  'form.password.label': 'Password',
  'form.password.hint': 'At least {min} characters.',
  'form.recover.help': 'Enter your email and we will send you a link to choose a new password.',
  'form.submit.login': 'Sign in',
  'form.submit.register': 'Create account',
  'form.submit.recover': 'Send link',
  'form.forgot': 'Forgot your password?',
  'form.switch.registerPrompt': "Don't have an account yet?",
  'form.switch.register': 'Create account',
  'form.switch.loginPrompt': 'Already have an account?',
  'form.switch.login': 'Sign in',
  'form.back': 'Back to sign in',
  'form.soon.login':
    'Signing in with email and password will be available soon. For now, use Google or continue as a guest.',
  'form.soon.register':
    'Creating an account with email and password will be available soon. For now, use Google or continue as a guest.',
  'form.soon.recover':
    'Recovering your password will be available soon. For now, use Google or continue as a guest.',
};
