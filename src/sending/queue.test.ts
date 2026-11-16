import { describe, expect, it, vi } from 'vitest';
import type { DetectionPayload } from '../types/trips';
import { createDetectionQueue, isDetectionPayload, QUEUE_CAP } from './queue';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  } as unknown as Storage;
  return { storage, data };
}

const KEY = 'urban-road-monitor.queue';

function item(n: number): DetectionPayload {
  return {
    id: `id-${n}`,
    latitude: 1.2,
    longitude: -77.3,
    gpsAccuracyM: 5,
    confidence: 0.8,
    bboxAreaRatio: 0.02,
    detectedAt: '2026-11-16T13:41:12.000Z',
  };
}

describe('the detection queue', () => {
  it('starts empty and keeps the detections in order', () => {
    const { storage } = memoryStorage();
    const queue = createDetectionQueue(() => storage);
    queue.adopt('u1');
    queue.push(item(1));
    queue.push(item(2));
    expect(queue.items().map((entry) => entry.id)).toEqual(['id-1', 'id-2']);
    expect(queue.size()).toBe(2);
  });

  it('ignores a detection whose id is already waiting', () => {
    const queue = createDetectionQueue(() => memoryStorage().storage);
    queue.push(item(1));
    queue.push(item(1));
    expect(queue.size()).toBe(1);
  });

  it('drops the oldest detections when it is full', () => {
    const queue = createDetectionQueue(() => memoryStorage().storage, 3);
    [1, 2, 3].forEach((n) => expect(queue.push(item(n))).toBe(0));
    expect(queue.push(item(4))).toBe(1);
    expect(queue.items().map((entry) => entry.id)).toEqual(['id-2', 'id-3', 'id-4']);
  });

  it('keeps 500 detections at most by default', () => {
    expect(QUEUE_CAP).toBe(500);
  });

  it('removes the detections that were delivered and forgets the trip when it empties', () => {
    const queue = createDetectionQueue(() => memoryStorage().storage);
    queue.push(item(1));
    queue.push(item(2));
    queue.setTripId('trip-1');
    queue.remove(['id-1']);
    expect(queue.items().map((entry) => entry.id)).toEqual(['id-2']);
    expect(queue.tripId()).toBe('trip-1');
    queue.remove(['id-2', 'unknown']);
    expect(queue.size()).toBe(0);
    expect(queue.tripId()).toBeNull();
  });

  it('survives a reload of the page', () => {
    const { storage } = memoryStorage();
    const first = createDetectionQueue(() => storage);
    first.adopt('u1');
    first.push(item(1));
    first.setTripId('trip-1');

    const second = createDetectionQueue(() => storage);
    second.adopt('u1');
    expect(second.items()).toEqual([item(1)]);
    expect(second.tripId()).toBe('trip-1');
  });

  it('does not hand the detections of one account to another', () => {
    const { storage, data } = memoryStorage();
    const first = createDetectionQueue(() => storage);
    first.adopt('u1');
    first.push(item(1));

    const second = createDetectionQueue(() => storage);
    second.adopt('u2');
    expect(second.size()).toBe(0);
    expect(data.has(KEY)).toBe(false); // What was saved for the other account is gone.
  });

  it('drops what is not a detection when it reads the storage', () => {
    const { storage } = memoryStorage({
      [KEY]: JSON.stringify({
        ownerId: 'u1',
        tripId: 'trip-1',
        items: [item(1), { id: 'bad' }, item(1), null, { ...item(2), latitude: 'x' }],
      }),
    });
    const queue = createDetectionQueue(() => storage);
    queue.adopt('u1');
    expect(queue.items()).toEqual([item(1)]);
  });

  it('starts empty when the saved text is not valid', () => {
    const { storage } = memoryStorage({ [KEY]: '{not json' });
    const queue = createDetectionQueue(() => storage);
    queue.adopt('u1');
    expect(queue.size()).toBe(0);
  });

  it('cleans the storage when nothing is left to send', () => {
    const { storage, data } = memoryStorage();
    const queue = createDetectionQueue(() => storage);
    queue.adopt('u1');
    queue.push(item(1));
    expect(data.has(KEY)).toBe(true);
    queue.remove(['id-1']);
    expect(data.has(KEY)).toBe(false);
  });

  it('works only in memory when the storage is missing or throws', () => {
    const none = createDetectionQueue(() => null);
    none.push(item(1));
    expect(none.size()).toBe(1);

    const broken = createDetectionQueue(() => {
      throw new Error('blocked');
    });
    broken.adopt('u1');
    broken.push(item(1));
    expect(broken.size()).toBe(1);
  });

  it('tells the listeners about each change until they stop listening', () => {
    const queue = createDetectionQueue(() => memoryStorage().storage);
    const listener = vi.fn();
    const stop = queue.subscribe(listener);
    queue.push(item(1));
    queue.remove(['id-1']);
    expect(listener).toHaveBeenCalledTimes(2);
    stop();
    queue.push(item(2));
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('clear empties the queue but keeps whose it is', () => {
    const { storage } = memoryStorage();
    const queue = createDetectionQueue(() => storage);
    queue.adopt('u1');
    queue.push(item(1));
    queue.clear();
    expect(queue.size()).toBe(0);
    queue.push(item(2));
    const again = createDetectionQueue(() => storage);
    again.adopt('u1');
    expect(again.size()).toBe(1);
  });
});

describe('isDetectionPayload', () => {
  it('accepts a complete detection and refuses the rest', () => {
    expect(isDetectionPayload(item(1))).toBe(true);
    expect(isDetectionPayload(null)).toBe(false);
    expect(isDetectionPayload('x')).toBe(false);
    expect(isDetectionPayload({ ...item(1), id: '' })).toBe(false);
    expect(isDetectionPayload({ ...item(1), confidence: Number.NaN })).toBe(false);
    expect(isDetectionPayload({ ...item(1), detectedAt: 'yesterday' })).toBe(false);
  });
});
