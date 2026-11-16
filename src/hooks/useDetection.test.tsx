import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DetectionLoopOptions } from '../detection/detection-loop';
import type { DetectionResult, Detector } from '../detection/detector';
import { useDetection, type DetectionDependencies } from './useDetection';

const RESULT: DetectionResult = {
  detections: [],
  frame: { width: 640, height: 480 },
  timings: { captureMs: 1, inferenceMs: 2, totalMs: 3 },
};
const detector: Detector = { detect: vi.fn() };

function fakeVideo(width = 640, height = 480, readyState = 4) {
  return { videoWidth: width, videoHeight: height, readyState } as unknown as HTMLVideoElement;
}

function makeDependencies(hidden = false) {
  const options: DetectionLoopOptions[] = [];
  const loop = { start: vi.fn(), stop: vi.fn(), isRunning: vi.fn(() => false) };
  const state = { hidden };
  let listener: () => void = () => undefined;
  const stopListening = vi.fn();
  const dependencies: DetectionDependencies = {
    createLoop: (given) => {
      options.push(given);
      return loop;
    },
    isHidden: () => state.hidden,
    onVisibilityChange: (callback) => {
      listener = callback;
      return stopListening;
    },
  };
  return { dependencies, options, loop, state, stopListening, notify: () => listener() };
}

describe('useDetection', () => {
  it('does nothing without a detector, a video or while inactive', () => {
    const { dependencies, loop } = makeDependencies();
    renderHook(() => useDetection(null, fakeVideo(), true, dependencies));
    renderHook(() => useDetection(detector, null, true, dependencies));
    renderHook(() => useDetection(detector, fakeVideo(), false, dependencies));
    expect(loop.start).not.toHaveBeenCalled();
  });

  it('starts the loop and gives the latest result', () => {
    const { dependencies, options, loop } = makeDependencies();
    const video = fakeVideo();
    const { result } = renderHook(() => useDetection(detector, video, true, dependencies));
    expect(loop.start).toHaveBeenCalledOnce();

    act(() => options[0].onResult(RESULT));

    expect(result.current.latest).toBe(RESULT);
  });

  it('gives the video and its size as the picture to analyze, or nothing if it has none yet', () => {
    const video = fakeVideo();
    const { dependencies, options } = makeDependencies();
    renderHook(() => useDetection(detector, video, true, dependencies));

    expect(options[0].getSource()).toEqual({
      source: video,
      frame: { width: 640, height: 480 },
    });

    const empty = makeDependencies();
    renderHook(() => useDetection(detector, fakeVideo(0, 0), true, empty.dependencies));
    expect(empty.options[0].getSource()).toBeNull();

    const loading = makeDependencies();
    renderHook(() => useDetection(detector, fakeVideo(640, 480, 1), true, loading.dependencies));
    expect(loading.options[0].getSource()).toBeNull();
  });

  it('pauses while the page is hidden and starts again when it is shown', () => {
    const { dependencies, loop, state, notify } = makeDependencies();
    renderHook(() => useDetection(detector, fakeVideo(), true, dependencies));
    expect(loop.start).toHaveBeenCalledTimes(1);

    state.hidden = true;
    act(() => notify());
    expect(loop.stop).toHaveBeenCalledTimes(1);

    state.hidden = false;
    act(() => notify());
    expect(loop.start).toHaveBeenCalledTimes(2);
  });

  it('does not start while the page opens hidden', () => {
    const { dependencies, loop } = makeDependencies(true);
    renderHook(() => useDetection(detector, fakeVideo(), true, dependencies));
    expect(loop.start).not.toHaveBeenCalled();
  });

  it('stops the loop and the listener when leaving', () => {
    const { dependencies, loop, stopListening } = makeDependencies();
    const { unmount } = renderHook(() => useDetection(detector, fakeVideo(), true, dependencies));
    unmount();
    expect(loop.stop).toHaveBeenCalled();
    expect(stopListening).toHaveBeenCalledOnce();
  });

  it('forgets the last result when it becomes inactive', () => {
    const { dependencies, options } = makeDependencies();
    const video = fakeVideo();
    const { result, rerender } = renderHook(
      ({ active }) => useDetection(detector, video, active, dependencies),
      { initialProps: { active: true } },
    );
    act(() => options[0].onResult(RESULT));
    expect(result.current.latest).toBe(RESULT);

    rerender({ active: false });

    expect(result.current.latest).toBeNull();
  });

  it('keeps the last result when one detection fails', () => {
    const { dependencies, options } = makeDependencies();
    const video = fakeVideo();
    const { result } = renderHook(() => useDetection(detector, video, true, dependencies));
    act(() => options[0].onResult(RESULT));
    act(() => options[0].onError(new Error('boom')));
    expect(result.current.latest).toBe(RESULT);
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
