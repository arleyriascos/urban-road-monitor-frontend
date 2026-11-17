import type { ReactNode } from 'react';

/** The logo of the app: a road seen from the driver's seat, in a green tile. */
export function BrandMark({ children }: { children?: ReactNode }) {
  return (
    <span className="brand-mark" aria-hidden="true">
      {children ?? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <path d="M8.5 3 4 21M15.5 3 20 21" />
          <path d="M12 4v2.5M12 10.5v3M12 17.5V20" />
        </svg>
      )}
    </span>
  );
}

interface BrandProps {
  /** The line under the name, such as the screen it is on. */
  subtitle?: ReactNode;
  /** Where the logo goes when it is a link; without it, it is plain text. */
  href?: string;
}

/** The logo with the name of the app and, under it, a short line. */
export function Brand({ subtitle, href }: BrandProps) {
  const content = (
    <>
      <BrandMark />
      <span className="brand__text">
        <span className="brand__name">Urban Road Monitor</span>
        {subtitle ? <span className="brand__sub">{subtitle}</span> : null}
      </span>
    </>
  );
  return href ? (
    <a className="brand" href={href}>
      {content}
    </a>
  ) : (
    <div className="brand">{content}</div>
  );
}
