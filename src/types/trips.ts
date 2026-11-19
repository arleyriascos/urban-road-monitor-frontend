/**
 * Types of the trips API (see docs/API-VIAJES.md in the backend repository).
 * A trip is one outing of a phone with the camera on; the detections belong to it.
 */

export type DevicePlatform = 'android' | 'ios' | 'other';

export interface DeviceInfo {
  platform: DevicePlatform;
  /** For example "Chrome 142". Optional, up to 100 characters. */
  browser?: string;
  /** Optional, up to 100 characters. */
  label?: string;
}

/** The rules the server will use to judge each detection of the trip. */
export interface TripRules {
  model: { version: string; minConfidence: number };
  limits: { maxGpsAccuracyM: number; maxBatchSize: number };
}

/** What POST /api/trips answers (201). */
export interface TripStarted extends TripRules {
  tripId: string;
  deviceId: string;
  startedAt: string;
}

/** One pothole seen by the camera, as the phone sends it. */
export interface DetectionPayload {
  /** Made on the phone: resending the same one is safe. */
  id: string;
  latitude: number;
  longitude: number;
  gpsAccuracyM: number;
  /** From 0 to 1. */
  confidence: number;
  /** The part of the picture the box covers, from 0 to 1. */
  bboxAreaRatio: number;
  /** ISO 8601 date. */
  detectedAt: string;
}

export type RejectionReason =
  'in_the_future' | 'too_old' | 'before_trip' | 'gps_not_accurate' | 'low_confidence';

/** What POST /api/trips/:id/detections answers. */
export interface BatchAnswer {
  received: number;
  stored: number;
  duplicates: number;
  rejected: { id: string; reason: RejectionReason }[];
}

export interface TripClosing {
  framesAnalyzed: number;
  distanceM: number;
  endedAt?: string;
}

export type Severity = 'leve' | 'moderado' | 'grave';

/** How many detections a trip has, in all and by severity (the three appear, even with 0). */
export interface TripDetectionCount {
  total: number;
  bySeverity: { severity: Severity; count: number }[];
}

/** A trip of the person as the list answers it: with how many detections it has in all. */
export interface TripSummary {
  id: string;
  /** ISO 8601 date. */
  startedAt: string;
  /** Null while the trip is still open. */
  endedAt: string | null;
  framesAnalyzed: number;
  distanceM: number;
  detectionCount: number;
  platform: DevicePlatform;
  /** The name of the phone, when the person gave one. */
  deviceLabel: string | null;
  /** The version of the model that judged the trip. */
  modelVersion: string;
}

/** One trip as GET /api/trips/:id answers it: its detections counted by severity. */
export interface TripView {
  id: string;
  startedAt: string;
  endedAt: string | null;
  framesAnalyzed: number;
  distanceM: number;
  detections: TripDetectionCount;
}

/** One page of the trips of the person, the newest first. */
export interface TripPage {
  trips: TripSummary[];
  /** Pass it back to read the next page; null on the last one. */
  nextCursor: string | null;
}
