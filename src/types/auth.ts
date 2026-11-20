/** The signed-in person, as the sign-in answers it. */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  /** An https address, or null when Google sent no usable photo. */
  avatarUrl: string | null;
  /** Names of their roles, in alphabetical order: "usuario", "colaborador", "administrador". */
  roles: string[];
}

/** The person with what their roles let them do (GET /api/auth/me). */
export interface AccountProfile extends AuthUser {
  permissions: string[];
  /** The account has a password of its own (it may also use Google). */
  hasPassword: boolean;
  /** The person proved the email is theirs. Google does it at every sign-in. */
  emailVerified: boolean;
}

/** What POST /api/auth/google answers: the session and the person. */
export interface GoogleLoginAnswer {
  /** The session identifier. It is shown only once: the page keeps it. */
  token: string;
  expiresAt: string;
  user: AuthUser;
}

/** What POST /api/auth/register and POST /api/auth/login answer: the same as the Google sign-in. */
export type PasswordSessionAnswer = GoogleLoginAnswer;

/** What POST /api/auth/password answers. */
export interface ChangePasswordAnswer {
  /** How many other sessions of the person were closed. The current one stays. */
  otherSessionsClosed: number;
}

/** What the calls that send a link by email answer: it went out (or, for a reset, it would have). */
export interface EmailLinkSentAnswer {
  sent: true;
}

/** What POST /api/auth/verify-email answers. */
export interface VerifyEmailAnswer {
  verified: true;
}

/** What POST /api/auth/reset-password answers. */
export interface ResetPasswordAnswer {
  reset: true;
}

/** What GET /api/auth/me answers. */
export interface MeAnswer {
  user: AccountProfile;
}
