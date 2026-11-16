import { describe, expect, it, vi } from 'vitest';
import {
  createModelSession,
  loadModel,
  type ModelLoaderDependencies,
  type OnnxRuntime,
} from './model-session';

class FakeTensor {
  constructor(
    readonly type: string,
    readonly data: Float32Array,
    readonly dims: readonly number[],
  ) {}
}

function fakeRuntime(output: unknown = { data: new Float32Array([1, 2, 3]) }) {
  const run = vi.fn(async (feeds: Record<string, unknown>) => {
    void feeds;
    return { output0: output as { data: unknown } };
  });
  const release = vi.fn(async () => undefined);
  const create = vi.fn(async () => ({ run, release }));
  const runtime: OnnxRuntime = {
    env: { wasm: {} },
    InferenceSession: { create },
    Tensor: FakeTensor,
  };
  return { runtime, run, release, create };
}

describe('createModelSession', () => {
  it('points the engine to the folder served by the app and uses one thread', async () => {
    const { runtime } = fakeRuntime();
    await createModelSession(new Uint8Array([1]), runtime);
    expect(runtime.env.wasm.wasmPaths).toBe('/ort/');
    expect(runtime.env.wasm.numThreads).toBe(1);
    expect(runtime.env.wasm.proxy).toBe(false);
  });

  it('opens the model with the WebAssembly engine', async () => {
    const { runtime, create } = fakeRuntime();
    const model = new Uint8Array([7, 7]);
    await createModelSession(model, runtime);
    expect(create).toHaveBeenCalledWith(
      model,
      expect.objectContaining({ executionProviders: ['wasm'] }),
    );
  });

  it('feeds the input as a 1x3x416x416 tensor and returns the output numbers', async () => {
    const { runtime, run } = fakeRuntime();
    const session = await createModelSession(new Uint8Array(), runtime);
    const input = new Float32Array(3 * 416 * 416);

    const output = await session.run(input);

    expect(Array.from(output)).toEqual([1, 2, 3]);
    const feeds = run.mock.calls[0][0] as { images: FakeTensor };
    expect(feeds.images.dims).toEqual([1, 3, 416, 416]);
    expect(feeds.images.data).toBe(input);
    expect(feeds.images.type).toBe('float32');
  });

  it('fails when the model does not give the expected output', async () => {
    const { runtime } = fakeRuntime({ data: [1, 2, 3] });
    const session = await createModelSession(new Uint8Array(), runtime);
    await expect(session.run(new Float32Array())).rejects.toThrow(/output0/);
  });

  it('releases the engine session', async () => {
    const { runtime, release } = fakeRuntime();
    const session = await createModelSession(new Uint8Array(), runtime);
    await session.release();
    expect(release).toHaveBeenCalledOnce();
  });
});

describe('loadModel', () => {
  it('downloads the model and the engine together, then opens the session, timing both parts', async () => {
    const { runtime } = fakeRuntime();
    let clock = 0;
    const times = [0, 800, 950];
    const dependencies: ModelLoaderDependencies = {
      now: () => times[clock++],
      download: vi.fn(async () => new Uint8Array([1, 2, 3])),
      loadRuntime: vi.fn(async () => runtime),
    };
    const onProgress = vi.fn();

    const loaded = await loadModel(onProgress, undefined, dependencies, '/x.onnx');

    expect(dependencies.download).toHaveBeenCalledWith('/x.onnx', onProgress, undefined);
    expect(loaded.downloadMs).toBe(800);
    expect(loaded.startMs).toBe(150);
    expect(typeof loaded.session.run).toBe('function');
  });

  it('fails when the download fails', async () => {
    const { runtime } = fakeRuntime();
    const dependencies: ModelLoaderDependencies = {
      now: () => 0,
      download: vi.fn(async () => {
        throw new Error('offline');
      }),
      loadRuntime: vi.fn(async () => runtime),
    };
    await expect(loadModel(() => undefined, undefined, dependencies)).rejects.toThrow('offline');
  });
});
