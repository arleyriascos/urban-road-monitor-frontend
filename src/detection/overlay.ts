import { formatPercent } from '../lib/format';
import type { PotholeSeverity } from '../types/map';
import { severityOf } from './severity';
import { sizeRatio } from './size';
import type { Detection, FrameSize } from './types';

/** How a picture of one size sits inside a view of another size when it is shown whole. */
export interface FitPlacement {
  scale: number;
  offsetX: number;
  offsetY: number;
}

/** Where the picture lands when the video is shown with `object-fit: contain`. */
export function fitPlacement(frame: FrameSize, view: FrameSize): FitPlacement {
  if (frame.width <= 0 || frame.height <= 0 || view.width <= 0 || view.height <= 0) {
    throw new RangeError('The picture and the view need a size above zero');
  }
  const scale = Math.min(view.width / frame.width, view.height / frame.height);
  return {
    scale,
    offsetX: (view.width - frame.width * scale) / 2,
    offsetY: (view.height - frame.height * scale) / 2,
  };
}

/** The same colors as the severity of the map (see styles.css), as the canvas needs them. */
export const SEVERITY_COLORS: Record<PotholeSeverity, string> = {
  leve: '#e8b800',
  moderado: '#ea7a1a',
  grave: '#c62828',
};

/** The part of a 2D canvas that the drawing uses. */
export interface OverlayContext {
  strokeStyle: string | CanvasGradient | CanvasPattern;
  fillStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  font: string;
  textBaseline: CanvasTextBaseline;
  clearRect(x: number, y: number, width: number, height: number): void;
  strokeRect(x: number, y: number, width: number, height: number): void;
  fillRect(x: number, y: number, width: number, height: number): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): { width: number };
}

/** The words on a box: how serious it is and how sure the model is. */
export function boxLabel(severity: PotholeSeverity, score: number): string {
  return `${severity} · ${formatPercent(score)}`;
}

const LABEL_HEIGHT = 20;
const LABEL_PADDING = 6;

/**
 * Draws the boxes over the video: a frame in the color of its severity and, above it (or inside
 * it when it touches the top), a tag with the severity and the confidence.
 */
export function drawOverlay(
  context: OverlayContext,
  detections: readonly Detection[],
  frame: FrameSize,
  view: FrameSize,
): void {
  context.clearRect(0, 0, view.width, view.height);
  if (detections.length === 0) return;
  const { scale, offsetX, offsetY } = fitPlacement(frame, view);
  context.lineWidth = 3;
  context.font = "600 13px 'JetBrains Mono', ui-monospace, monospace";
  context.textBaseline = 'middle';

  for (const found of detections) {
    const severity = severityOf(sizeRatio(found, frame));
    const color = SEVERITY_COLORS[severity];
    const x = offsetX + found.x * scale;
    const y = offsetY + found.y * scale;
    const width = found.width * scale;
    const height = found.height * scale;

    context.strokeStyle = color;
    context.strokeRect(x, y, width, height);

    const text = boxLabel(severity, found.score);
    const tagWidth = context.measureText(text).width + LABEL_PADDING * 2;
    const tagY = y >= LABEL_HEIGHT ? y - LABEL_HEIGHT : y;
    context.fillStyle = color;
    context.fillRect(x, tagY, tagWidth, LABEL_HEIGHT);
    context.fillStyle = severity === 'grave' ? '#ffffff' : '#1b2024';
    context.fillText(text, x + LABEL_PADDING, tagY + LABEL_HEIGHT / 2);
  }
}
