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
}

/** What POST /api/auth/google answers: the session and the person. */
export interface GoogleLoginAnswer {
  /** The session identifier. It is shown only once: the page keeps it. */
  token: string;
  expiresAt: string;
  user: AuthUser;
}

/** What GET /api/auth/me answers. */
export interface MeAnswer {
  user: AccountProfile;
}
