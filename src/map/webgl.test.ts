import { describe, expect, it } from 'vitest';
import { isWebGLSupported } from './webgl';

type ContextName = 'webgl2' | 'webgl';

/** A fake document whose canvas only knows the given contexts (jsdom has no WebGL). */
function fakeDocument(available: ContextName[], fails = false): Document {
  return {
    createElement: () => ({
      getContext: (name: string) => {
        if (fails) throw new Error('blocked');
        return available.includes(name as ContextName) ? {} : null;
      },
    }),
  } as unknown as Document;
}

describe('isWebGLSupported', () => {
  it('is true when WebGL 2 is available', () => {
    expect(isWebGLSupported(fakeDocument(['webgl2']))).toBe(true);
  });

  it('is true when only WebGL 1 is available', () => {
    expect(isWebGLSupported(fakeDocument(['webgl']))).toBe(true);
  });

  it('is false when the browser has no WebGL', () => {
    expect(isWebGLSupported(fakeDocument([]))).toBe(false);
  });

  it('is false when the browser blocks the context', () => {
    expect(isWebGLSupported(fakeDocument(['webgl2'], true))).toBe(false);
  });
});
