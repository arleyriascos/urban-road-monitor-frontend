import { apiUrl } from '../config/env';

export type ApiErrorKind = 'network' | 'timeout' | 'http';

/** Error with enough information for the UI to explain what happened. */
export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    /** Extra data the backend sends with some errors, such as which point was too far. */
    public readonly details?: Record<string, unknown>,
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

interface ErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
}

/** GET request to the backend that returns the parsed JSON body. */
export function getJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return requestJson<T>(path, { method: 'GET' }, options);
}

/** POST request with a JSON body to the backend that returns the parsed JSON body. */
export function postJson<T>(path: string, body: unknown, options: RequestOptions = {}): Promise<T> {
  return requestJson<T>(
    path,
    { method: 'POST', body: JSON.stringify(body), contentType: 'application/json' },
    options,
  );
}

async function requestJson<T>(
  path: string,
  request: { method: 'GET' | 'POST'; body?: string; contentType?: string },
  { signal, timeoutMs = 60_000 }: RequestOptions,
): Promise<T> {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (request.contentType) headers['Content-Type'] = request.contentType;

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      method: request.method,
      headers,
      body: request.body,
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
    // The backend always answers errors as { error: { code, message, details? } }.
    const body = (await response.json().catch(() => null)) as ErrorBody | null;
    const details = body?.error?.details;
    throw new ApiError(
      'http',
      body?.error?.message ?? `The server answered with status ${response.status}`,
      response.status,
      body?.error?.code,
      details !== null && typeof details === 'object'
        ? (details as Record<string, unknown>)
        : undefined,
    );
  }

  return (await response.json()) as T;
}
