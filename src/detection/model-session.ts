import {
  MODEL_INPUT_NAME,
  MODEL_INPUT_SIZE,
  MODEL_OUTPUT_NAME,
  MODEL_URL,
  WASM_FOLDER,
} from './model-info';
import { downloadWithProgress, type DownloadProgress } from './model-download';

/** What the detector needs from the engine: the model input in, the model output out. */
export interface ModelSession {
  run(input: Float32Array): Promise<Float32Array>;
  release(): Promise<void>;
}

/** The small part of onnxruntime-web that this app uses (so the tests can replace it). */
export interface OnnxRuntime {
  env: { wasm: { wasmPaths?: string; numThreads?: number; proxy?: boolean } };
  InferenceSession: {
    create(
      model: Uint8Array,
      options: { executionProviders: string[]; graphOptimizationLevel?: string },
    ): Promise<{
      run(feeds: Record<string, unknown>): Promise<Record<string, { data: unknown }>>;
      release(): Promise<void>;
    }>;
  };
  Tensor: new (type: 'float32', data: Float32Array, dims: readonly number[]) => unknown;
}

/** Loads the engine only when the camera needs it: it is a big file and the map does not use it. */
export async function loadOnnxRuntime(): Promise<OnnxRuntime> {
  return (await import('onnxruntime-web/wasm')) as unknown as OnnxRuntime;
}

/**
 * Opens a model in the engine. One thread, because more threads need a page isolated from
 * other sites (special headers) and the map uses third-party tiles; the engine is served by
 * the app itself.
 */
export async function createModelSession(
  model: Uint8Array,
  runtime: OnnxRuntime,
): Promise<ModelSession> {
  runtime.env.wasm.wasmPaths = WASM_FOLDER;
  runtime.env.wasm.numThreads = 1;
  runtime.env.wasm.proxy = false;
  const session = await runtime.InferenceSession.create(model, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  });
  const shape = [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE];

  return {
    async run(input: Float32Array): Promise<Float32Array> {
      const feeds = { [MODEL_INPUT_NAME]: new runtime.Tensor('float32', input, shape) };
      const results = await session.run(feeds);
      const output = results[MODEL_OUTPUT_NAME];
      if (!output || !(output.data instanceof Float32Array)) {
        throw new Error(`The model did not give "${MODEL_OUTPUT_NAME}" as numbers`);
      }
      return output.data;
    },
    release: () => session.release(),
  };
}

/** What a finished load tells: the session and how long each part took (milliseconds). */
export interface LoadedModel {
  session: ModelSession;
  downloadMs: number;
  startMs: number;
}

export interface ModelLoaderDependencies {
  now: () => number;
  download: (
    url: string,
    onProgress: (progress: DownloadProgress) => void,
    signal?: AbortSignal,
  ) => Promise<Uint8Array>;
  loadRuntime: () => Promise<OnnxRuntime>;
}

const defaultDependencies: ModelLoaderDependencies = {
  now: () => performance.now(),
  download: downloadWithProgress,
  loadRuntime: loadOnnxRuntime,
};

/** Downloads the model, loads the engine and opens the session, timing each part. */
export async function loadModel(
  onProgress: (progress: DownloadProgress) => void,
  signal?: AbortSignal,
  dependencies: ModelLoaderDependencies = defaultDependencies,
  url: string = MODEL_URL,
): Promise<LoadedModel> {
  const begin = dependencies.now();
  const [model, runtime] = await Promise.all([
    dependencies.download(url, onProgress, signal),
    dependencies.loadRuntime(),
  ]);
  const downloaded = dependencies.now();
  const session = await createModelSession(model, runtime);
  const opened = dependencies.now();
  return { session, downloadMs: downloaded - begin, startMs: opened - downloaded };
}
