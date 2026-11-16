/**
 * Types of the street endpoints (see docs/API-CALLES.md in the backend repository): the
 * summary of a segment for its popup and the street search.
 */

/** What is added up for a part of a street. */
export interface StretchSummary {
  segments: number;
  lengthM: number;
  /** Potholes that are not repaired: the ones the map draws. */
  visiblePotholes: number;
  /** Potholes seen at least twice: the only ones that change the damage. */
  confirmedPotholes: number;
  damageScore: number;
  /** The worst severity among the confirmed potholes, or null when there is none. */
  worstSeverity: { name: string; weight: number } | null;
}

export interface StretchAnswer {
  roadId: number;
  roadName: string | null;
  /** The first and the last segment that were added up; null for an empty stretch. */
  fromSegmentIndex: number | null;
  toSegmentIndex: number | null;
  summary: StretchSummary;
}

/** What GET /api/road-segments/:id/summary answers. */
export interface SegmentSummaryAnswer {
  segment: {
    id: number;
    roadId: number;
    roadName: string | null;
    /** The place of the segment in its street, from 1. */
    position: number;
    segmentsInRoad: number;
  };
  radius: number;
  /** The segment and the `radius` segments before and after it. */
  window: StretchAnswer;
  /** The whole street. */
  road: StretchAnswer;
}

export interface StreetBounds {
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
}

/** A street found by the search: all the ways with the same name count as one. */
export interface StreetMatch {
  name: string;
  /** All the ids of its ways, to highlight them. */
  roadIds: number[];
  segments: number;
  center: { latitude: number; longitude: number };
  bounds: StreetBounds;
}

/** What GET /api/roads/search answers. */
export interface StreetSearchAnswer {
  query: string;
  streets: StreetMatch[];
}
