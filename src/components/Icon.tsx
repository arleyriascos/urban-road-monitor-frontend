/** The line icons of the app, drawn on a 24 × 24 grid with the color of the text. */
const PATHS = {
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  check: <path d="m5 12 5 5 9-10" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  locate: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  minus: <path d="M6 12h12" />,
  route: (
    <>
      <circle cx="6" cy="19" r="2.5" />
      <circle cx="18" cy="5" r="2.5" />
      <path d="M8.5 19H17a3.5 3.5 0 0 0 0-7H7a3.5 3.5 0 0 1 0-7h8.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  swap: <path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3" />,
} as const;

export type IconName = keyof typeof PATHS;

/** A decorative icon: screen readers skip it, so the text next to it must say what it means. */
export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
