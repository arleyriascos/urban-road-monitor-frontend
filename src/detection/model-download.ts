/** How far the download of the model has gone. `total` is null when the server does not say. */
export interface DownloadProgress {
  loadedBytes: number;
  totalBytes: number | null;
}

export class ModelDownloadError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = 'ModelDownloadError';
  }
}

/**
 * Downloads a file and reports the progress while it comes. The model is about 12 MB, so on a
 * phone with a slow connection the person needs to see that something is happening.
 */
export async function downloadWithProgress(
  url: string,
  onProgress: (progress: DownloadProgress) => void,
  signal?: AbortSignal,
  fetchFile: typeof fetch = fetch,
): Promise<Uint8Array> {
  let response: Response;
  try {
    response = await fetchFile(url, { signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ModelDownloadError('No se pudo conectar para bajar el modelo', null);
  }
  if (!response.ok) {
    throw new ModelDownloadError(`El servidor respondió ${response.status}`, response.status);
  }

  const header = Number(response.headers.get('content-length'));
  const totalBytes = Number.isFinite(header) && header > 0 ? header : null;

  if (!response.body) {
    const whole = new Uint8Array(await response.arrayBuffer());
    onProgress({ loadedBytes: whole.length, totalBytes: whole.length });
    return whole;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loadedBytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loadedBytes += value.length;
    onProgress({ loadedBytes, totalBytes });
  }

  const file = new Uint8Array(loadedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    file.set(chunk, offset);
    offset += chunk.length;
  }
  return file;
}

/** The share of the file that is already here, from 0 to 1, or null when the size is unknown. */
export function progressFraction(progress: DownloadProgress): number | null {
  if (progress.totalBytes === null) return null;
  return Math.min(1, progress.loadedBytes / progress.totalBytes);
}
