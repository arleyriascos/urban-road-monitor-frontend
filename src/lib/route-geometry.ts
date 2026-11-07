import type { Position } from '../types/map';
import type { RouteAnswer } from '../types/route';

const EARTH_RADIUS_M = 6_371_008.8;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Segments shorter than this get no arrow: it would be piled on the next one. */
export const MIN_ARROW_STEP_M = 40;

/** Distance in meters between two [longitude, latitude] points. */
export function distanceM(a: Position, b: Position): number {
  const [lonA, latA] = a;
  const [lonB, latB] = b;
  const dLat = toRadians(latB - latA);
  const dLon = toRadians(lonB - lonA);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Compass bearing from one [longitude, latitude] point to another: 0 north, 90 east. */
export function bearingDegrees(from: Position, to: Position): number {
  const [lonA, latA] = from;
  const [lonB, latB] = to;
  const dLon = toRadians(lonB - lonA);
  const y = Math.sin(dLon) * Math.cos(toRadians(latB));
  const x =
    Math.cos(toRadians(latA)) * Math.sin(toRadians(latB)) -
    Math.sin(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.cos(dLon);
  return ((((Math.atan2(y, x) * 180) / Math.PI) % 360) + 360) % 360;
}

/** The point halfway along a line, and the direction the line goes there. */
export function midpointOf(line: readonly Position[]): { point: Position; bearing: number } | null {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 1; i < line.length; i++) {
    const length = distanceM(line[i - 1], line[i]);
    lengths.push(length);
    total += length;
  }
  if (total === 0) return null;

  let remaining = total / 2;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const fraction = lengths[i] === 0 ? 0 : Math.min(1, remaining / lengths[i]);
      const [lonA, latA] = line[i];
      const [lonB, latB] = line[i + 1];
      return {
        point: [lonA + (lonB - lonA) * fraction, latA + (latB - latA) * fraction],
        bearing: bearingDegrees(line[i], line[i + 1]),
      };
    }
    remaining -= lengths[i];
  }
  return null;
}

export interface ArrowSpot {
  latitude: number;
  longitude: number;
  /** Degrees clockwise from north, in the direction of travel. */
  bearing: number;
  /** The `order` of the segment it belongs to. */
  order: number;
}

/**
 * One arrow in the middle of each long enough segment, pointing the way of the trip. The
 * lines come in travel order, so a segment crossed against its drawing already points right.
 */
export function arrowSpots(route: RouteAnswer, minLengthM = MIN_ARROW_STEP_M): ArrowSpot[] {
  const spots: ArrowSpot[] = [];
  for (const step of route.route.features) {
    if (step.properties.lengthM < minLengthM) continue;
    const middle = midpointOf(step.geometry.coordinates);
    if (!middle) continue;
    const [longitude, latitude] = middle.point;
    spots.push({ latitude, longitude, bearing: middle.bearing, order: step.properties.order });
  }
  return spots;
}
