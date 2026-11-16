import { useEffect, useRef } from 'react';
import { drawOverlay, type OverlayContext } from '../detection/overlay';
import type { Detection, FrameSize } from '../detection/types';

interface OverlayCanvasProps {
  detections: readonly Detection[];
  /** The size of the picture the boxes were found in. Without it nothing is drawn. */
  frame: FrameSize | null;
}

/** A transparent layer over the video where the boxes are drawn; it follows the size of the video. */
export function OverlayCanvas({ detections, frame }: OverlayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const paint = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) return;
      // Setting the size also clears the canvas, so it is only touched when it changes.
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      const context = canvas.getContext('2d') as OverlayContext | null;
      if (!context) return;
      if (frame && frame.width > 0 && frame.height > 0) {
        drawOverlay(context, detections, frame, { width, height });
      } else {
        context.clearRect(0, 0, width, height);
      }
    };

    paint();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(paint);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [detections, frame]);

  return <canvas ref={canvasRef} className="camera__overlay" aria-hidden="true" />;
}
