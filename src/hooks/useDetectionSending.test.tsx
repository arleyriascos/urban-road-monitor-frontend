import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DetectionResult } from '../detection/detector';
import { MODEL_VERSION } from '../detection/model-info';
import type { SendAccess } from '../sending/access';
import type { GpsFix } from '../sending/geo';
import { createDetectionQueue } from '../sending/queue';
import type { Sender, SenderState } from '../sending/sender';
import type { DetectionState } from './useDetection';
import type { Geolocation } from './useGeolocation';
import { useDetectionSending, type SendingDependencies } from './useDetectionSending';

const ALLOWED: SendAccess = { status: 'allowed', token: 'tok', userId: 'u1' };
const FIX: GpsFix = { latitude: 1.2136, longitude: -77.2811, accuracyM: 6, timestamp: 0 };

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  } as unknown as Storage;
}

function result(scores: number[], width = 1000, height = 500): DetectionResult {
  return {
    detections: scores.map((score, index) => ({
      x: 100 * index,
      y: 100,
      width: 200,
      height: 100,
      score,
    })),
    frame: { width, height },
    timings: { captureMs: 1, inferenceMs: 1, totalMs: 2 },
  };
}

const detectionOf = (latest: DetectionResult | null): DetectionState => ({
  latest,
  reading: null,
  error: null,
});

const geo = (fix: GpsFix | null): Geolocation => ({
  state: fix ? { status: 'ready', fix } : { status: 'waiting' },
  latest: () => fix,
});

function setup() {
  const queue = createDetectionQueue(() => memoryStorage());
  let state: SenderState = { status: 'idle', pending: 0, stored: 0, discarded: 0, failures: 0 };
  const listeners = new Set<() => void>();
  const sender = {
    kick: vi.fn(),
    retryNow: vi.fn(),
    finish: vi.fn<Sender['finish']>(async () => undefined),
    stop: vi.fn(),
    getState: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  } satisfies Sender;
  let counter = 0;
  let reconnect: () => void = () => undefined;
  const createSenderSpy = vi.fn<(options: unknown) => Sender>(() => sender);
  const dependencies: SendingDependencies = {
    queue,
    api: vi.fn(() => ({
      startTrip: vi.fn(),
      sendDetections: vi.fn(),
      closeTrip: vi.fn(),
    })),
    createSender: createSenderSpy as unknown as SendingDependencies['createSender'],
    newId: () => `id-${++counter}`,
    now: () => new Date('2026-11-16T13:41:12.000Z'),
    device: () => ({ platform: 'android' }),
    onStored: vi.fn(),
    onReconnect: (listener) => {
      reconnect = listener;
      return () => undefined;
    },
  };
  return {
    queue,
    sender,
    dependencies,
    createSenderSpy,
    setState: (next: Partial<SenderState>) => {
      state = { ...state, ...next };
      listeners.forEach((listener) => listener());
    },
    reconnect: () => reconnect(),
  };
}

type Props = {
  access: SendAccess;
  active: boolean;
  latest: DetectionResult | null;
  fix: GpsFix | null;
};

function render(setupResult: ReturnType<typeof setup>, initial: Partial<Props> = {}) {
  return renderHook(
    (props: Props) =>
      useDetectionSending(
        props.access,
        props.active,
        detectionOf(props.latest),
        geo(props.fix),
        setupResult.dependencies,
      ),
    { initialProps: { access: ALLOWED, active: true, latest: null, fix: FIX, ...initial } },
  );
}

describe('useDetectionSending', () => {
  it('does nothing for a guest: no sender, nothing saved', () => {
    const s = setup();
    const { result: view, rerender } = render(s, { access: { status: 'guest' } });
    rerender({ access: { status: 'guest' }, active: true, latest: result([0.9]), fix: FIX });
    expect(s.createSenderSpy).not.toHaveBeenCalled();
    expect(s.queue.size()).toBe(0);
    expect(view.current.status).toBe('off');
    expect(view.current.recording).toBe(false);
  });

  it('creates the sender for a collaborator with the model version and the device', () => {
    const s = setup();
    render(s);
    expect(s.createSenderSpy).toHaveBeenCalledTimes(1);
    expect(s.createSenderSpy.mock.calls[0][0]).toMatchObject({
      modelVersion: MODEL_VERSION,
      device: { platform: 'android' },
    });
    expect(s.dependencies.api).toHaveBeenCalledWith('tok');
  });

  it('sends at once what a previous visit left in the queue', () => {
    const s = setup();
    render(s, { active: false });
    expect(s.sender.kick).toHaveBeenCalledTimes(1);
  });

  it('keeps the surest pothole of a picture, with the position of the phone, and kicks the sender', () => {
    const s = setup();
    const { rerender } = render(s);
    rerender({ access: ALLOWED, active: true, latest: result([0.9, 0.7]), fix: FIX });

    // Both boxes are at the same position of the phone: one detection of a place is enough.
    expect(s.queue.items()).toHaveLength(1);
    expect(s.queue.items()[0]).toMatchObject({
      id: 'id-1',
      latitude: 1.2136,
      longitude: -77.2811,
      gpsAccuracyM: 6,
      confidence: 0.9,
      detectedAt: '2026-11-16T13:41:12.000Z',
    });
    expect(s.queue.items()[0].bboxAreaRatio).toBeCloseTo(0.04, 10);
    expect(s.sender.kick).toHaveBeenCalledTimes(2); // On opening and for the new detection.
  });

  it('does not keep what the server would refuse', () => {
    const s = setup();
    const { rerender } = render(s);
    rerender({ access: ALLOWED, active: true, latest: result([0.2]), fix: FIX });
    rerender({
      access: ALLOWED,
      active: true,
      latest: result([0.9]),
      fix: { ...FIX, accuracyM: 50 },
    });
    expect(s.queue.size()).toBe(0);
  });

  it('keeps nothing while there is no position', () => {
    const s = setup();
    const { rerender } = render(s, { fix: null });
    rerender({ access: ALLOWED, active: true, latest: result([0.9]), fix: null });
    expect(s.queue.size()).toBe(0);
  });

  it('keeps one detection for the same pothole seen in several pictures in a row', () => {
    const s = setup();
    const { rerender } = render(s);
    rerender({ access: ALLOWED, active: true, latest: result([0.9]), fix: FIX });
    rerender({ access: ALLOWED, active: true, latest: result([0.9]), fix: FIX });
    expect(s.queue.size()).toBe(1);
  });

  it('does not keep anything while the camera is off', () => {
    const s = setup();
    const { rerender } = render(s, { active: false });
    rerender({ access: ALLOWED, active: false, latest: result([0.9]), fix: FIX });
    expect(s.queue.size()).toBe(0);
  });

  it('closes the outing with the pictures analyzed and the distance when the camera turns off', () => {
    const s = setup();
    const { rerender } = render(s);
    rerender({ access: ALLOWED, active: true, latest: result([]), fix: FIX });
    rerender({ access: ALLOWED, active: true, latest: result([]), fix: FIX });
    rerender({
      access: ALLOWED,
      active: true,
      latest: result([]),
      fix: { ...FIX, latitude: 1.2146 },
    });
    rerender({ access: ALLOWED, active: false, latest: null, fix: null });

    expect(s.sender.finish).toHaveBeenCalledTimes(1);
    const closing = vi.mocked(s.sender.finish).mock.calls[0][0];
    expect(closing.framesAnalyzed).toBe(3);
    expect(closing.distanceM).toBeCloseTo(111.2, 0);
  });

  it('shows what the sender reports while the camera is on', () => {
    const s = setup();
    const { result: view } = render(s);
    expect(view.current).toMatchObject({ recording: true, status: 'idle' });
    act(() => s.setState({ status: 'waiting', pending: 4, stored: 7, discarded: 1 }));
    expect(view.current).toEqual({
      recording: true,
      status: 'waiting',
      pending: 4,
      stored: 7,
      discarded: 1,
    });
  });

  it('retries at once when the connection returns', () => {
    const s = setup();
    render(s);
    s.reconnect();
    expect(s.sender.retryNow).toHaveBeenCalledTimes(1);
  });

  it('stops the sender when the account changes or the screen goes away', () => {
    const s = setup();
    const { unmount } = render(s);
    unmount();
    expect(s.sender.stop).toHaveBeenCalledTimes(1);
  });
});
