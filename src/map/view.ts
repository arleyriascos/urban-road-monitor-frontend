/**
 * What the floating panels cover of the map, so a route is fitted into the part that stays
 * visible and not under the panel.
 */

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Padding in pixels for Leaflet's fitBounds: [left, top] and [right, bottom]. */
export interface Insets {
  paddingTopLeft: [number, number];
  paddingBottomRight: [number, number];
}

export interface Point {
  x: number;
  y: number;
}

/** Below this zoom the arrows crowd into what looks like a dashed line, so they are hidden. */
export const MIN_ARROW_ZOOM = 15;

export function arrowsVisibleAt(zoom: number): boolean {
  return zoom >= MIN_ARROW_ZOOM;
}

const EDGE = 24;
const GAP = 20;

/**
 * Room to leave around a route. On a wide screen the route panel covers the left and the
 * legend the right; on a phone the panel is a sheet at the bottom and the legend is hidden.
 */
export function coveredInsets({
  map,
  panel,
  legend,
  phone,
}: {
  map: Rect;
  panel: Rect | null;
  legend: Rect | null;
  phone: boolean;
}): Insets {
  if (phone) {
    const bottom = panel ? Math.max(EDGE, map.bottom - panel.top + 16) : EDGE;
    return { paddingTopLeft: [EDGE, 70], paddingBottomRight: [EDGE, bottom] };
  }
  const left = panel ? Math.max(EDGE, panel.right - map.left + GAP) : EDGE;
  const right = legend ? Math.max(EDGE, map.right - legend.left + GAP) : EDGE;
  return { paddingTopLeft: [left, 30], paddingBottomRight: [right, EDGE] };
}

/** Whether an area (its top-left and bottom-right corners, in pixels) is inside the free part. */
export function fitsInFreeArea(
  northWest: Point,
  southEast: Point,
  size: { width: number; height: number },
  insets: Insets,
): boolean {
  const [left, top] = insets.paddingTopLeft;
  const [right, bottom] = insets.paddingBottomRight;
  return (
    northWest.x >= left &&
    northWest.y >= top &&
    southEast.x <= size.width - right &&
    southEast.y <= size.height - bottom
  );
}
