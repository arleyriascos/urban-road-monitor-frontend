import { describe, expect, it, vi } from 'vitest';
import { createFrameCapturer, type CaptureContext } from './frame-capture';

function fakeContext(pixels = new Uint8ClampedArray(16)) {
  const calls: string[] = [];
  const context: CaptureContext = {
    fillStyle: '',
    fillRect: vi.fn(() => calls.push('fillRect')),
    drawImage: vi.fn(() => calls.push('drawImage')),
    getImageData: vi.fn(() => {
      calls.push('getImageData');
      return { data: pixels };
    }),
  };
  return { context, calls };
}

describe('createFrameCapturer', () => {
  it('fills the square with gray, draws the picture inside and reads the pixels, in that order', () => {
    const pixels = new Uint8ClampedArray(4 * 4 * 4);
    const { context, calls } = fakeContext(pixels);
    const capturer = createFrameCapturer(4, () => context);
    const source = {} as CanvasImageSource;

    const frame = capturer.capture(source, { width: 8, height: 4 });

    expect(calls).toEqual(['fillRect', 'drawImage', 'getImageData']);
    expect(context.fillStyle).toBe('rgb(114, 114, 114)');
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 4, 4);
    // An 8x4 picture in a 4x4 square: scaled to 4x2 and centered, with one empty row above.
    expect(context.drawImage).toHaveBeenCalledWith(source, 0, 1, 4, 2);
    expect(frame.rgba).toBe(pixels);
    expect(frame.letterbox).toMatchObject({ scale: 0.5, padX: 0, padY: 1 });
  });

  it('asks for the canvas only once and reuses it for every frame', () => {
    const { context } = fakeContext();
    const makeContext = vi.fn(() => context);
    const capturer = createFrameCapturer(4, makeContext);

    capturer.capture({} as CanvasImageSource, { width: 4, height: 4 });
    capturer.capture({} as CanvasImageSource, { width: 4, height: 4 });

    expect(makeContext).toHaveBeenCalledTimes(1);
    expect(context.drawImage).toHaveBeenCalledTimes(2);
  });

  it('makes a square the size of the model by default', () => {
    const makeContext = vi.fn(() => fakeContext().context);
    createFrameCapturer(undefined, makeContext);
    expect(makeContext).toHaveBeenCalledWith(416);
  });
});
