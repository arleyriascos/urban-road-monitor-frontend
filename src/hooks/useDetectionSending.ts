import { useEffect, useRef, useState } from 'react';
import { wakeAiService } from '../api/ai-service';
import { closeTrip, sendDetections, startTrip } from '../api/trips';
import { MODEL_VERSION } from '../detection/model-info';
import {
  createRepeatFilter,
  DEFAULT_RULES,
  toPayload,
  type RepeatFilter,
} from '../sending/candidate';
import { currentDevice } from '../sending/device';
import { createDistanceTracker, type DistanceTracker } from '../sending/geo';
import { createDetectionQueue, type DetectionQueue } from '../sending/queue';
import { createSender, type Sender, type SenderApi, type SenderState } from '../sending/sender';
import type { SendAccess } from '../sending/access';
import type { DeviceInfo } from '../types/trips';
import type { DetectionState } from './useDetection';
import type { Geolocation } from './useGeolocation';

export interface SendingDependencies {
  queue: DetectionQueue;
  api: (token: string) => SenderApi;
  createSender: typeof createSender;
  newId: () => string;
  now: () => Date;
  device: () => DeviceInfo;
  /** Called when the server stored detections: the AI service wakes up to group them. */
  onStored: () => void;
  /** Calls the listener when the connection returns or the page is shown again. */
  onReconnect: (listener: () => void) => () => void;
}

const defaultDependencies: SendingDependencies = {
  queue: createDetectionQueue(),
  api: (token) => ({
    startTrip: (body, signal) => startTrip(token, body, signal),
    sendDetections: (tripId, detections, signal) =>
      sendDetections(token, tripId, detections, signal),
    closeTrip: (tripId, closing, signal) => closeTrip(token, tripId, closing, signal),
  }),
  createSender,
  newId: () => crypto.randomUUID(),
  now: () => new Date(),
  device: currentDevice,
  onStored: () => void wakeAiService(),
  onReconnect: (listener) => {
    const onVisible = () => {
      if (!document.hidden) listener();
    };
    window.addEventListener('online', listener);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', listener);
      document.removeEventListener('visibilitychange', onVisible);
    };
  },
};

/** What the screen shows about saving: nothing when the person is not a collaborator. */
export interface SendingView {
  /** True while the detections of the camera are being kept: collaborator, camera on. */
  recording: boolean;
  pending: number;
  stored: number;
  discarded: number;
  status: SenderState['status'] | 'off';
}

const OFF: SendingView = { recording: false, pending: 0, stored: 0, discarded: 0, status: 'off' };

interface Outing {
  startedAt: Date;
  frames: number;
  tracker: DistanceTracker;
  repeats: RepeatFilter;
}

function newOuting(now: Date): Outing {
  return {
    startedAt: now,
    frames: 0,
    tracker: createDistanceTracker(),
    repeats: createRepeatFilter(),
  };
}

/**
 * Keeps what the camera sees and sends it to the server, when the person is a collaborator.
 * The sender lives as long as the account may send: it also sends what a previous visit left
 * in the queue. Each time the camera turns on starts an outing; when it turns off, the
 * outing is closed with its totals.
 */
export function useDetectionSending(
  access: SendAccess,
  active: boolean,
  detection: DetectionState,
  geolocation: Geolocation,
  dependencies: SendingDependencies = defaultDependencies,
): SendingView {
  const dependenciesRef = useRef(dependencies);
  const outing = useRef<Outing>(newOuting(dependencies.now()));
  const senderRef = useRef<Sender | null>(null);
  const [senderState, setSenderState] = useState<SenderState | null>(null);

  const token = access.status === 'allowed' ? access.token : null;
  const userId = access.status === 'allowed' ? access.userId : null;

  // The sender of this account.
  useEffect(() => {
    if (token === null || userId === null) return;
    const {
      queue,
      api,
      createSender: make,
      device,
      onStored,
      onReconnect,
    } = dependenciesRef.current;
    queue.adopt(userId);
    const sender = make({
      queue,
      api: api(token),
      device: device(),
      modelVersion: MODEL_VERSION,
      startedAt: () => outing.current.startedAt,
      onStored,
    });
    senderRef.current = sender;
    const publish = () => setSenderState(sender.getState());
    const stopListening = sender.subscribe(publish);
    const stopReconnect = onReconnect(() => sender.retryNow());
    publish();
    sender.kick(); // What the last visit left behind.
    return () => {
      stopReconnect();
      stopListening();
      sender.stop();
      senderRef.current = null;
      setSenderState(null);
    };
  }, [token, userId]);

  // Each time the camera turns on, a new outing starts; when it turns off, it is closed.
  useEffect(() => {
    if (!active) return;
    const mine = newOuting(dependenciesRef.current.now());
    outing.current = mine;
    return () => {
      void senderRef.current?.finish({
        framesAnalyzed: mine.frames,
        distanceM: Math.round(mine.tracker.total() * 10) / 10,
      });
    };
  }, [active]);

  // Every new picture: count it and keep its potholes.
  const latest = detection.latest;
  useEffect(() => {
    const sender = senderRef.current;
    if (!active || !latest || !sender) return;
    const { queue, newId, now } = dependenciesRef.current;
    const mine = outing.current;
    mine.frames += 1;
    const fix = geolocation.latest();
    if (!fix || latest.detections.length === 0) return;
    const time = now();
    let added = false;
    for (const found of latest.detections) {
      const payload = toPayload(found, latest.frame, fix, DEFAULT_RULES, newId(), time);
      if (!payload || !mine.repeats.accept(payload, time.getTime())) continue;
      queue.push(payload);
      added = true;
    }
    if (added) sender.kick();
    // The position is read from a ref on purpose: a new fix alone must not count a picture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest, active]);

  // The distance of the outing comes from the GPS fixes.
  const fix = geolocation.state.status === 'ready' ? geolocation.state.fix : null;
  useEffect(() => {
    if (active && fix) outing.current.tracker.add(fix);
  }, [active, fix]);

  if (token === null || senderState === null) return OFF;
  return {
    recording: active,
    pending: senderState.pending,
    stored: senderState.stored,
    discarded: senderState.discarded,
    status: senderState.status,
  };
}
