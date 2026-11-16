import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OverlayCanvas } from './OverlayCanvas';

function fakeContext() {
  return {
    clearRect: vi.fn(),
    strokeRect: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 40 })),
  };
}

function withCanvasSize(width: number, height: number, context: ReturnType<typeof fakeContext>) {
  vi.spyOn(HTMLCanvasElement.prototype, 'clientWidth', 'get').mockReturnValue(width);
  vi.spyOn(HTMLCanvasElement.prototype, 'clientHeight', 'get').mockReturnValue(height);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  );
}

afterEach(() => vi.restoreAllMocks());

describe('OverlayCanvas', () => {
  it('draws the boxes at the size of the canvas', () => {
    const context = fakeContext();
    withCanvasSize(200, 100, context);

    const { container } = render(
      <OverlayCanvas
        detections={[{ x: 10, y: 20, width: 40, height: 30, score: 0.9 }]}
        frame={{ width: 200, height: 100 }}
      />,
    );

    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(100);
    expect(context.strokeRect).toHaveBeenCalledWith(10, 20, 40, 30);
  });

  it('is hidden from screen readers: the boxes are a help for the eyes only', () => {
    withCanvasSize(200, 100, fakeContext());
    const { container } = render(<OverlayCanvas detections={[]} frame={null} />);
    expect(container.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('only clears the canvas when there is no picture size yet', () => {
    const context = fakeContext();
    withCanvasSize(200, 100, context);
    render(
      <OverlayCanvas detections={[{ x: 1, y: 1, width: 5, height: 5, score: 1 }]} frame={null} />,
    );
    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 200, 100);
    expect(context.strokeRect).not.toHaveBeenCalled();
  });

  it('draws nothing while the canvas has no size', () => {
    const context = fakeContext();
    withCanvasSize(0, 0, context);
    render(<OverlayCanvas detections={[]} frame={{ width: 10, height: 10 }} />);
    expect(context.clearRect).not.toHaveBeenCalled();
  });

  it('draws again when the size of the canvas changes', () => {
    const context = fakeContext();
    withCanvasSize(200, 100, context);
    const observers: Array<() => void> = [];
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          observers.push(callback);
        }
        observe() {}
        disconnect = disconnect;
      },
    );

    const { unmount } = render(
      <OverlayCanvas detections={[]} frame={{ width: 200, height: 100 }} />,
    );
    const before = context.clearRect.mock.calls.length;
    observers[0]();
    expect(context.clearRect.mock.calls.length).toBe(before + 1);

    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
