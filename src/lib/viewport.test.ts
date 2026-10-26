import { afterEach, describe, expect, it, vi } from 'vitest';
import { isPhoneViewport } from './viewport';

function stubMatchMedia(matches: boolean) {
  const matchMedia = vi.fn(() => ({ matches }));
  Object.defineProperty(window, 'matchMedia', { value: matchMedia, configurable: true });
  return matchMedia;
}

afterEach(() => {
  Reflect.deleteProperty(window, 'matchMedia');
});

describe('isPhoneViewport', () => {
  it('is true when the screen matches the phone breakpoint', () => {
    const matchMedia = stubMatchMedia(true);
    expect(isPhoneViewport()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith('(max-width: 640px)');
  });

  it('is false on bigger screens', () => {
    stubMatchMedia(false);
    expect(isPhoneViewport()).toBe(false);
  });

  it('is false when the browser cannot answer', () => {
    expect(isPhoneViewport()).toBe(false);
  });
});
