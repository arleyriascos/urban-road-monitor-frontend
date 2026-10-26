import { describe, expect, it } from 'vitest';
import { escapeHtml, safeColor } from './html';

describe('escapeHtml', () => {
  it('leaves plain text alone', () => {
    expect(escapeHtml('Carrera 24 Bis')).toBe('Carrera 24 Bis');
  });

  it('escapes the characters that can open or close markup', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
    );
    expect(escapeHtml("Calle d'Ávila & Co")).toBe('Calle d&#39;Ávila &amp; Co');
  });
});

describe('safeColor', () => {
  it.each(['#DC2626', '#fff', '#12345678', '#22c55e'])('accepts the hex color %s', (color) => {
    expect(safeColor(color)).toBe(color);
  });

  it.each(['red', 'rgb(1,2,3)', '#GGG', '#12', 'red;background:url(x)', '" onload="x', ''])(
    'replaces the unsafe value "%s" with a neutral gray',
    (color) => {
      expect(safeColor(color)).toBe('#9ca3af');
    },
  );
});
