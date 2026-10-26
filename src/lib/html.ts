const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Leaflet popups are HTML strings: street names must never be able to inject markup. */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => ESCAPES[character]);
}

const FALLBACK_COLOR = '#9ca3af';

/** Colors come from the API and end up inside a style attribute: only accept hex colors. */
export function safeColor(color: string): string {
  return /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : FALLBACK_COLOR;
}
