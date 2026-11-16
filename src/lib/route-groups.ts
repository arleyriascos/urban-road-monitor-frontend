import type { RouteAnswer, RouteStepFeature, RouteStreet } from '../types/route';
import type { StretchSummary } from '../types/roads';
import { combineSummaries } from './street-summary';

export const UNNAMED_STREET = 'Calle sin nombre';

/** Consecutive segments of the same street, so the route reads as a list of streets. */
export interface RouteGroup {
  /** Position in the list, from 0. */
  index: number;
  /** The street name, or "Calle sin nombre" when its segments have none. */
  name: string;
  steps: RouteStepFeature[];
  lengthM: number;
  /** How many of its segments have damage. */
  damagedSteps: number;
  /** The potholes along this street, when the backend sent them; null when it did not. */
  summary: StretchSummary | null;
}

/**
 * A route of about 9 km can have 90 segments of one block each. Grouping the segments that
 * follow each other on the same street gives a list people can read and walk through.
 * The same street appearing again later in the route makes a new group.
 */
export function groupRouteSteps(route: RouteAnswer): RouteGroup[] {
  const groups: RouteGroup[] = [];
  let lastName: string | null | undefined;

  for (const step of route.route.features) {
    const roadName = step.properties.roadName?.trim() || null;
    const last = groups[groups.length - 1];
    const damaged = step.properties.damageScore > 0 ? 1 : 0;

    if (last && roadName === lastName) {
      last.steps.push(step);
      last.lengthM += step.properties.lengthM;
      last.damagedSteps += damaged;
    } else {
      groups.push({
        index: groups.length,
        name: roadName ?? UNNAMED_STREET,
        steps: [step],
        lengthM: step.properties.lengthM,
        damagedSteps: damaged,
        summary: null,
      });
    }
    lastName = roadName;
  }
  return attachStreets(groups, route.streets);
}

/**
 * The backend answers the potholes of each street the route follows (`streets`). Each group
 * takes the summaries of the streets that begin at one of its steps. The streets are an extra:
 * without them the groups are the same, only without the summary.
 */
function attachStreets(
  groups: RouteGroup[],
  streets: readonly RouteStreet[] | undefined,
): RouteGroup[] {
  if (!streets || streets.length === 0) return groups;
  for (const group of groups) {
    const first = group.steps[0].properties.order;
    const last = group.steps[group.steps.length - 1].properties.order;
    const mine = streets.filter((street) => street.fromOrder >= first && street.fromOrder <= last);
    group.summary = mine.length > 0 ? combineSummaries(mine.map((street) => street.summary)) : null;
  }
  return groups;
}

/** How many segments of the route have damage. */
export function countDamagedSteps(groups: readonly RouteGroup[]): number {
  return groups.reduce((total, group) => total + group.damagedSteps, 0);
}
