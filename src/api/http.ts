import { apiUrl } from '../config/env';

export type ApiErrorKind = 'network' | 'timeout' | 'http';

/** Error with enough information for the UI to explain what happened. */
export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  /** Lets the caller cancel the request (e.g. when the component unmounts). */
  signal?: AbortSignal;
  /**
   * Render's free plan puts the backend to sleep; waking it up can take
   * close to a minute, so the default timeout is generous.
   */
  timeoutMs?: number;
}

/** GET request to the backend that returns the parsed JSON body. */
export async function getJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { signal, timeoutMs = 60_000 } = options;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      headers: { Accept: 'application/json' },
      signal: combinedSignal,
    });
  } catch (error) {
    if (timeoutSignal.aborted) {
      throw new ApiError('timeout', 'The server took too long to answer');
    }
    if (signal?.aborted) {
      throw error; // Cancelled on purpose: not an error to show.
    }
    throw new ApiError('network', 'Could not reach the server');
  }

  if (!response.ok) {
    // The backend always answers errors as { error: { code, message } }.
    const body = (await response.json().catch(() => null)) as {
      error?: { code?: string; message?: string };
    } | null;
    throw new ApiError(
      'http',
      body?.error?.message ?? `The server answered with status ${response.status}`,
      response.status,
      body?.error?.code,
    );
  }

  return (await response.json()) as T;
}
