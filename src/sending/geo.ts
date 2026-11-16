/** Where the phone was at one moment, as the browser's GPS gives it. */
export interface GpsFix {
  latitude: number;
  longitude: number;
  /** The error of the fix, in meters. */
  accuracyM: number;
  /** When the fix was taken, in milliseconds since 1970. */
  timestamp: number;
}

const EARTH_RADIUS_M = 6_371_000;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** The distance in meters between two points over the surface of the Earth. */
export function distanceBetween(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** A step shorter than this is GPS noise while the phone is still, not movement. */
export const MIN_STEP_M = 3;

/** A fix worse than this does not count to measure the distance of the trip. */
export const MAX_TRACK_ACCURACY_M = 30;

export interface DistanceTracker {
  add(fix: GpsFix): void;
  /** The meters traveled so far. */
  total(): number;
}

/** Adds up the distance of the trip from its fixes, ignoring the noise of a still phone. */
export function createDistanceTracker(): DistanceTracker {
  let last: GpsFix | null = null;
  let total = 0;
  return {
    add(fix) {
      if (fix.accuracyM > MAX_TRACK_ACCURACY_M) return;
      if (last === null) {
        last = fix;
        return;
      }
      const step = distanceBetween(last, fix);
      if (step < MIN_STEP_M) return;
      total += step;
      last = fix;
    },
    total: () => total,
  };
}
