import type { DetectionPayload } from '../types/trips';

const STORAGE_KEY = 'urban-road-monitor.queue';

/** The most detections kept waiting in the phone. When full, the oldest ones are dropped. */
export const QUEUE_CAP = 500;

/** What the queue keeps between visits: whose detections are these and which trip they go to. */
export interface QueueSnapshot {
  /** The account the detections belong to: another account never sends them. */
  ownerId: string | null;
  /** The trip they were being sent to, or null when none was opened yet. */
  tripId: string | null;
  items: DetectionPayload[];
}

export interface DetectionQueue {
  /** The detections waiting, oldest first. */
  items(): readonly DetectionPayload[];
  size(): number;
  tripId(): string | null;
  /** Adds one at the end. Returns how many old ones were dropped to make room (0 or 1). */
  push(item: DetectionPayload): number;
  /** Takes the detections with these ids out of the queue. */
  remove(ids: Iterable<string>): void;
  setTripId(tripId: string | null): void;
  /** Starts with what was saved for this account; what belongs to another account is dropped. */
  adopt(ownerId: string | null): void;
  clear(): void;
  /** Calls the listener after every change; gives back how to stop listening. */
  subscribe(listener: () => void): () => void;
}

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Only what has exactly the shape of a detection comes back from the storage. */
export function isDetectionPayload(value: unknown): value is DetectionPayload {
  if (value === null || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    item.id !== '' &&
    isFiniteNumber(item.latitude) &&
    isFiniteNumber(item.longitude) &&
    isFiniteNumber(item.gpsAccuracyM) &&
    isFiniteNumber(item.confidence) &&
    isFiniteNumber(item.bboxAreaRatio) &&
    typeof item.detectedAt === 'string' &&
    !Number.isNaN(Date.parse(item.detectedAt))
  );
}

function parseSnapshot(raw: string | null): QueueSnapshot | null {
  if (raw === null) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (data === null || typeof data !== 'object') return null;
    const record = data as Record<string, unknown>;
    if (!Array.isArray(record.items)) return null;
    const seen = new Set<string>();
    const items: DetectionPayload[] = [];
    for (const entry of record.items) {
      if (isDetectionPayload(entry) && !seen.has(entry.id)) {
        seen.add(entry.id);
        items.push(entry);
      }
    }
    return {
      ownerId: typeof record.ownerId === 'string' ? record.ownerId : null,
      tripId: typeof record.tripId === 'string' ? record.tripId : null,
      items,
    };
  } catch {
    return null;
  }
}

/**
 * The detections that wait to be sent. They live in memory and are copied to localStorage on
 * every change, so closing the page, losing the signal or running out of battery loses nothing.
 * localStorage can be missing or throw (private windows, full storage): then the queue works
 * only in memory.
 */
export function createDetectionQueue(
  getStorage: () => Storage | null = browserStorage,
  cap: number = QUEUE_CAP,
): DetectionQueue {
  let state: QueueSnapshot = { ownerId: null, tripId: null, items: [] };
  const listeners = new Set<() => void>();

  const save = () => {
    try {
      const storage = getStorage();
      if (!storage) return;
      if (state.items.length === 0 && state.tripId === null) storage.removeItem(STORAGE_KEY);
      else storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Nothing to do: the queue goes on in memory.
    }
  };
  const changed = () => {
    save();
    listeners.forEach((listener) => listener());
  };

  return {
    items: () => state.items,
    size: () => state.items.length,
    tripId: () => state.tripId,
    push(item) {
      if (state.items.some((existing) => existing.id === item.id)) return 0;
      const items = [...state.items, item];
      const dropped = Math.max(0, items.length - cap);
      state = { ...state, items: items.slice(dropped) };
      changed();
      return dropped;
    },
    remove(ids) {
      const gone = new Set(ids);
      if (gone.size === 0) return;
      const items = state.items.filter((item) => !gone.has(item.id));
      if (items.length === state.items.length) return;
      state = { ...state, items };
      changed();
    },
    setTripId(tripId) {
      if (state.tripId === tripId) return;
      state = { ...state, tripId };
      changed();
    },
    adopt(ownerId) {
      let saved: QueueSnapshot | null;
      try {
        saved = parseSnapshot(getStorage()?.getItem(STORAGE_KEY) ?? null);
      } catch {
        saved = null;
      }
      state =
        saved !== null && ownerId !== null && saved.ownerId === ownerId
          ? saved
          : { ownerId, tripId: null, items: [] };
      changed();
    },
    clear() {
      state = { ownerId: state.ownerId, tripId: null, items: [] };
      changed();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
