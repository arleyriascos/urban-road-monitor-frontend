import { describe, expect, it, vi } from 'vitest';
import {
  downloadWithProgress,
  ModelDownloadError,
  progressFraction,
  type DownloadProgress,
} from './model-download';

function streamOf(...chunks: number[][]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(new Uint8Array(chunk));
      controller.close();
    },
  });
}

describe('downloadWithProgress', () => {
  it('joins the chunks and reports each step', async () => {
    const response = new Response(streamOf([1, 2], [3], [4, 5, 6]), {
      headers: { 'content-length': '6' },
    });
    const steps: DownloadProgress[] = [];

    const file = await downloadWithProgress(
      '/m.onnx',
      (step) => steps.push(step),
      undefined,
      vi.fn(async () => response),
    );

    expect(Array.from(file)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(steps).toEqual([
      { loadedBytes: 2, totalBytes: 6 },
      { loadedBytes: 3, totalBytes: 6 },
      { loadedBytes: 6, totalBytes: 6 },
    ]);
  });

  it('works without the size of the file', async () => {
    const response = new Response(streamOf([9, 9]));
    const steps: DownloadProgress[] = [];
    await downloadWithProgress(
      '/m.onnx',
      (step) => steps.push(step),
      undefined,
      vi.fn(async () => response),
    );
    expect(steps.at(-1)).toEqual({ loadedBytes: 2, totalBytes: null });
  });

  it('fails with the status when the server says no', async () => {
    const fetchFile = vi.fn(async () => new Response('', { status: 404 }));
    const attempt = downloadWithProgress('/m.onnx', () => undefined, undefined, fetchFile);
    await expect(attempt).rejects.toMatchObject({ name: 'ModelDownloadError', status: 404 });
  });

  it('fails with a clear error when there is no connection', async () => {
    const fetchFile = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    const attempt = downloadWithProgress('/m.onnx', () => undefined, undefined, fetchFile);
    await expect(attempt).rejects.toBeInstanceOf(ModelDownloadError);
    await expect(attempt).rejects.toMatchObject({ status: null });
  });

  it('lets an abort through as it is', async () => {
    const controller = new AbortController();
    controller.abort();
    const abort = new DOMException('aborted', 'AbortError');
    const fetchFile = vi.fn(async () => {
      throw abort;
    });
    const attempt = downloadWithProgress('/m.onnx', () => undefined, controller.signal, fetchFile);
    await expect(attempt).rejects.toBe(abort);
  });
});

describe('progressFraction', () => {
  it('divides what came by the total', () => {
    expect(progressFraction({ loadedBytes: 3, totalBytes: 12 })).toBe(0.25);
  });

  it('is null when the total is unknown', () => {
    expect(progressFraction({ loadedBytes: 3, totalBytes: null })).toBeNull();
  });

  it('never goes above 1', () => {
    expect(progressFraction({ loadedBytes: 20, totalBytes: 10 })).toBe(1);
  });
});
