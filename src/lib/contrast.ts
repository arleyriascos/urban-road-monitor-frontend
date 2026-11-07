/** Contrast between two colors, as WCAG defines it: 1 is no contrast and 21 is black on white. */

function parseHex(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) throw new Error(`Not a hex color: ${hex}`);
  const digits =
    match[1].length === 3
      ? match[1]
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : match[1];
  return [0, 2, 4].map((start) => parseInt(digits.slice(start, start + 2), 16)) as [
    number,
    number,
    number,
  ];
}

/** How bright a color looks, from 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const [red, green, blue] = parseHex(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** The contrast ratio of two colors, the same whichever is the text. */
export function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

/** The minimum contrast for normal-size text (WCAG AA). */
export const MIN_TEXT_CONTRAST = 4.5;
