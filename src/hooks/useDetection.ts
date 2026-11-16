import { useEffect, useRef, useState } from 'react';
import { createDetectionLoop } from '../detection/detection-loop';
import type { DetectionResult, Detector } from '../detection/detector';
import { createMeters, type MeterReading } from '../detection/meters';
import type { FrameSize } from '../detection/types';

export interface DetectionDependencies {
  createLoop: typeof createDetectionLoop;
  isHidden: () => boolean;
  now: () => number;
  /** Calls the listener when the page is hidden or shown; gives back how to stop listening. */
  onVisibilityChange: (listener: () => void) => () => void;
}

const defaultDependencies: DetectionDependencies = {
  createLoop: createDetectionLoop,
  isHidden: () => document.hidden,
  now: () => performance.now(),
  onVisibilityChange: (listener) => {
    document.addEventListener('visibilitychange', listener);
    return () => document.removeEventListener('visibilitychange', listener);
  },
};

export interface DetectionState {
  latest: DetectionResult | null;
  /** What the two meters show for the latest detection. */
  reading: MeterReading | null;
  error: unknown;
}

const EMPTY_STATE: DetectionState = { latest: null, reading: null, error: null };

/**
 * Runs the detector on the video while `active` is true. It pauses while the page is hidden
 * (the phone is not looking at the road then and the battery matters) and starts again alone.
 */
export function useDetection(
  detector: Detector | null,
  video: HTMLVideoElement | null,
  active: boolean,
  dependencies: DetectionDependencies = defaultDependencies,
): DetectionState {
  const [state, setState] = useState<DetectionState>(EMPTY_STATE);
  const dependenciesRef = useRef(dependencies);

  useEffect(() => {
    if (!detector || !video || !active) return;
    const { createLoop, isHidden, now, onVisibilityChange } = dependenciesRef.current;
    const meters = createMeters();

    const loop = createLoop({
      detector,
      getSource: () => {
        const frame: FrameSize = { width: video.videoWidth, height: video.videoHeight };
        // The video has no picture yet (or the camera just changed): nothing to analyze.
        if (frame.width === 0 || frame.height === 0 || video.readyState < 2) return null;
        return { source: video, frame };
      },
      onResult: (latest) =>
        setState({ latest, reading: meters.record(latest, now()), error: null }),
      onError: (error) => setState((previous) => ({ ...previous, error })),
    });

    const sync = () => {
      if (isHidden()) loop.stop();
      else loop.start();
    };
    sync();
    const stopListening = onVisibilityChange(sync);

    return () => {
      stopListening();
      loop.stop();
      setState(EMPTY_STATE);
    };
  }, [detector, video, active]);

  // While inactive nothing is shown, and what was left from before is dropped when it ends.
  return active ? state : EMPTY_STATE;
}
