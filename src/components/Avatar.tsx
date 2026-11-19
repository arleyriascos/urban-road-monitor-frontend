import { useState } from 'react';
import { initialsOf, safeAvatarUrl } from '../lib/person';
import type { AuthUser } from '../types/auth';

/** The photo of the person, or their initials when there is none or it does not load. */
export function Avatar({ user, size = 36 }: { user: AuthUser; size?: number }) {
  const photo = safeAvatarUrl(user.avatarUrl);
  // The photo that failed, so a new photo of another person gets its own try.
  const [failed, setFailed] = useState<string | null>(null);
  const style = { width: size, height: size };

  if (photo && failed !== photo) {
    return (
      <img
        className="account__avatar"
        style={style}
        src={photo}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setFailed(photo)}
      />
    );
  }
  return (
    <span
      className="account__avatar account__avatar--initials"
      style={{ ...style, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initialsOf(user.fullName)}
    </span>
  );
}
