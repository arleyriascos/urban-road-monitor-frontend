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

export const apiUrl = normalizeUrl(import.meta.env.VITE_API_URL || DEFAULT_API_URL);
