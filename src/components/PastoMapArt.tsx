import {
  PASTO_MAIN_ROADS,
  PASTO_MAP_HEIGHT,
  PASTO_MAP_WIDTH,
  PASTO_SIDE_STREETS,
} from '../lib/pasto-map-art';

/**
 * The streets of Pasto as a quiet drawing for the entry screen. It is decoration: a screen
 * reader skips it, and it holds no data (no potholes, no counts). Colors come from the tokens
 * of the entry screen, so it follows the theme.
 */
export function PastoMapArt() {
  return (
    <svg
      className="pasto-art"
      viewBox={`0 0 ${PASTO_MAP_WIDTH} ${PASTO_MAP_HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <path className="pasto-art__side" d={PASTO_SIDE_STREETS} />
      <path className="pasto-art__main" d={PASTO_MAIN_ROADS} />
    </svg>
  );
}
