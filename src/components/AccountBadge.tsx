import { useState } from 'react';
import { describeRole, initialsOf, safeAvatarUrl } from '../lib/person';
import type { AuthUser } from '../types/auth';

export interface AccountActions {
  /** The signed-in person, or null for a guest. */
  user: AuthUser | null;
  onSignOut: () => void;
  /** A guest goes back to the entry screen to sign in. */
  onSignIn: () => void;
}

/** The photo of the person, or their initials when there is none or it does not load. */
function Avatar({ user }: { user: AuthUser }) {
  const photo = safeAvatarUrl(user.avatarUrl);
  // The photo that failed, so a new photo of another person gets its own try.
  const [failed, setFailed] = useState<string | null>(null);

  if (photo && failed !== photo) {
    return (
      <img
        className="account__avatar"
        src={photo}
        alt=""
        width={36}
        height={36}
        referrerPolicy="no-referrer"
        onError={() => setFailed(photo)}
      />
    );
  }
  return (
    <span className="account__avatar account__avatar--initials" aria-hidden="true">
      {initialsOf(user.fullName)}
    </span>
  );
}

/** Who is using the app: the photo, name and role with "Cerrar sesión", or "Ingresar" for a guest. */
export function AccountBadge({ user, onSignOut, onSignIn }: AccountActions) {
  if (!user) {
    return (
      <div className="account">
        <button type="button" className="button button--quiet account__button" onClick={onSignIn}>
          Ingresar
        </button>
      </div>
    );
  }

  return (
    <div className="account">
      <Avatar user={user} />
      <p className="account__who" title={user.email}>
        <span className="account__name">{user.fullName}</span>
        <span className="account__role">{describeRole(user.roles)}</span>
      </p>
      <button type="button" className="button button--quiet account__button" onClick={onSignOut}>
        Cerrar sesión
      </button>
    </div>
  );
}
