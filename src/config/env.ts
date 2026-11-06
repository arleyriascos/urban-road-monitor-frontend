/**
 * Backend URL. The frontend only knows this address: it never talks to the
 * database or the AI service directly.
 *
 * - Local development: http://localhost:3000 (default)
 * - Vercel: set VITE_API_URL to the Render URL in the project settings
 */
const DEFAULT_API_URL = 'http://localhost:3000';

function normalizeUrl(url: string): string {
  // Remove trailing slashes so "https://api.com/" and "https://api.com" behave the same.
  return url.trim().replace(/\/+$/, '');
}

/** An optional address: null when it is missing or blank. */
export function optionalUrl(value: string | undefined): string | null {
  const url = normalizeUrl(value ?? '');
  return url === '' ? null : url;
}

export const apiUrl = normalizeUrl(import.meta.env.VITE_API_URL || DEFAULT_API_URL);

/**
 * Public address of the AI service on Render (optional). The browser only uses it to wake
 * the service up: Render wakes a sleeping free service when a browser asks, but not when
 * the backend does. Without it the app works the same, but cannot wake the service.
 */
export const aiServiceUrl = optionalUrl(import.meta.env.VITE_AI_SERVICE_URL);
