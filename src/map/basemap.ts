import type { Map as LeafletMap } from 'leaflet';
import { isWebGLSupported } from './webgl';

export interface BasemapHandle {
  /** Call it when the map is removed, so a basemap that is still loading is not added to it. */
  cancel: () => void;
}

/**
 * Adds the vector basemap to the map. MapLibre is a big library, so it is loaded in the
 * background: the streets appear first and the basemap fills in behind them.
 * Without WebGL, or if the basemap cannot be loaded, the streets still work on a plain background.
 */
export function attachBasemap(map: LeafletMap, webgl: boolean = isWebGLSupported()): BasemapHandle {
  let cancelled = false;

  if (webgl) {
    import('./vector-basemap')
      .then(({ addVectorBasemap }) => {
        if (!cancelled) addVectorBasemap(map);
      })
      .catch((error: unknown) => {
        console.warn('No se pudo cargar el mapa base', error);
      });
  }

  return {
    cancel: () => {
      cancelled = true;
    },
  };
}
