import type { Map as LeafletMap } from 'leaflet';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { attachBasemap } from './basemap';
import { addVectorBasemap } from './vector-basemap';

// The real module needs WebGL and loads MapLibre: the tests only care about when it is called.
vi.mock('./vector-basemap', () => ({ addVectorBasemap: vi.fn() }));

const map = {} as LeafletMap;

/** Lets the dynamic import() inside attachBasemap finish. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('attachBasemap', () => {
  it('adds the vector basemap to the map when WebGL is available', async () => {
    attachBasemap(map, true);
    await settle();
    expect(addVectorBasemap).toHaveBeenCalledTimes(1);
    expect(addVectorBasemap).toHaveBeenCalledWith(map);
  });

  it('does nothing without WebGL: the streets still work on a plain background', async () => {
    attachBasemap(map, false);
    await settle();
    expect(addVectorBasemap).not.toHaveBeenCalled();
  });

  it('does not add the basemap to a map that was removed while it was loading', async () => {
    const basemap = attachBasemap(map, true);
    basemap.cancel();
    await settle();
    expect(addVectorBasemap).not.toHaveBeenCalled();
  });

  it('only warns when the basemap cannot be added, without breaking the map', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.mocked(addVectorBasemap).mockImplementationOnce(() => {
      throw new Error('no WebGL context');
    });

    attachBasemap(map, true);
    await settle();

    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
