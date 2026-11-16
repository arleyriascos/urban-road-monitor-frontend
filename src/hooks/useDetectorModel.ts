import { useCallback, useEffect, useRef, useState } from 'react';
import { createDetector, type Detector } from '../detection/detector';
import { createFrameCapturer } from '../detection/frame-capture';
import type { DownloadProgress } from '../detection/model-download';
import { loadModel, type LoadedModel } from '../detection/model-session';

export type ModelState =
  | { status: 'idle' }
  | { status: 'loading'; progress: DownloadProgress | null }
  | { status: 'ready'; detector: Detector; downloadMs: number; startMs: number }
  | { status: 'error'; message: string };

export interface ModelDependencies {
  loadModel: (
    onProgress: (progress: DownloadProgress) => void,
    signal: AbortSignal,
  ) => Promise<LoadedModel>;
  makeDetector: (loaded: LoadedModel) => Detector;
}

const defaultDependencies: ModelDependencies = {
  loadModel: (onProgress, signal) => loadModel(onProgress, signal),
  makeDetector: (loaded) => createDetector(loaded.session, createFrameCapturer()),
};

export interface DetectorModelControls {
  state: ModelState;
  /** Starts the download of the model (only the first time; later calls do nothing). */
  load: () => void;
}

/**
 * The model of the potholes. It is a big download, so it only starts when the person opens the
 * camera, and it is freed when the person leaves the screen.
 */
export function useDetectorModel(
  dependencies: ModelDependencies = defaultDependencies,
): DetectorModelControls {
  const [state, setState] = useState<ModelState>({ status: 'idle' });
  const started = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const loaded = useRef<LoadedModel | null>(null);
  const { loadModel: load, makeDetector } = dependencies;

  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    const abort = new AbortController();
    controller.current = abort;
    setState({ status: 'loading', progress: null });

    load((progress) => {
      if (!abort.signal.aborted) setState({ status: 'loading', progress });
    }, abort.signal).then(
      (result) => {
        if (abort.signal.aborted) {
          void result.session.release();
          return;
        }
        loaded.current = result;
        setState({
          status: 'ready',
          detector: makeDetector(result),
          downloadMs: result.downloadMs,
          startMs: result.startMs,
        });
      },
      (error: unknown) => {
        if (abort.signal.aborted) return;
        started.current = false;
        setState({
          status: 'error',
          message:
            error instanceof Error && error.message
              ? 'No pudimos cargar el modelo de detección. Revisa tu conexión y vuelve a intentarlo.'
              : 'No pudimos cargar el modelo de detección.',
        });
      },
    );
  }, [load, makeDetector]);

  useEffect(
    () => () => {
      controller.current?.abort();
      void loaded.current?.session.release();
      loaded.current = null;
    },
    [],
  );

  return { state, load: start };
}
