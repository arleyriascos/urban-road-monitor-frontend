import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Detector } from '../detection/detector';
import type { LoadedModel } from '../detection/model-session';
import { useDetectorModel, type ModelDependencies } from './useDetectorModel';

const detector: Detector = { detect: vi.fn() };

function fakeLoaded() {
  const release = vi.fn(async () => undefined);
  const loaded: LoadedModel = {
    session: { run: vi.fn(), release },
    downloadMs: 900,
    startMs: 120,
  };
  return { loaded, release };
}

function makeDependencies(load: ModelDependencies['loadModel']): ModelDependencies {
  return { loadModel: vi.fn(load), makeDetector: () => detector };
}

describe('useDetectorModel', () => {
  it('does not download anything until told to', () => {
    const dependencies = makeDependencies(async () => fakeLoaded().loaded);
    const { result } = renderHook(() => useDetectorModel(dependencies));
    expect(result.current.state).toEqual({ status: 'idle' });
    expect(dependencies.loadModel).not.toHaveBeenCalled();
  });

  it('shows the progress and then is ready with the times', async () => {
    const { loaded } = fakeLoaded();
    const dependencies = makeDependencies(async (onProgress) => {
      onProgress({ loadedBytes: 50, totalBytes: 100 });
      return loaded;
    });
    const { result } = renderHook(() => useDetectorModel(dependencies));

    act(() => result.current.load());
    expect(result.current.state.status).toBe('loading');

    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(result.current.state).toEqual({
      status: 'ready',
      detector,
      downloadMs: 900,
      startMs: 120,
    });
  });

  it('downloads only once even if asked twice', async () => {
    const dependencies = makeDependencies(async () => fakeLoaded().loaded);
    const { result } = renderHook(() => useDetectorModel(dependencies));
    act(() => result.current.load());
    act(() => result.current.load());
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(dependencies.loadModel).toHaveBeenCalledOnce();
  });

  it('says in Spanish that it failed and lets the person try again', async () => {
    let fail = true;
    const dependencies = makeDependencies(async () => {
      if (fail) throw new Error('offline');
      return fakeLoaded().loaded;
    });
    const { result } = renderHook(() => useDetectorModel(dependencies));

    act(() => result.current.load());
    await waitFor(() => expect(result.current.state.status).toBe('error'));
    expect(result.current.state).toMatchObject({ message: expect.stringMatching(/modelo/) });

    fail = false;
    act(() => result.current.load());
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
  });

  it('frees the model when the screen is left', async () => {
    const { loaded, release } = fakeLoaded();
    const dependencies = makeDependencies(async () => loaded);
    const { result, unmount } = renderHook(() => useDetectorModel(dependencies));
    act(() => result.current.load());
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    unmount();

    expect(release).toHaveBeenCalledOnce();
  });

  it('frees a model that finishes loading after the screen was left', async () => {
    const { loaded, release } = fakeLoaded();
    let finish: (loaded: LoadedModel) => void = () => undefined;
    const dependencies = makeDependencies(() => new Promise((resolve) => (finish = resolve)));
    const { result, unmount } = renderHook(() => useDetectorModel(dependencies));
    act(() => result.current.load());

    unmount();
    await act(async () => finish(loaded));

    expect(release).toHaveBeenCalledOnce();
  });
});
