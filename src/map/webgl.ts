/**
 * The vector basemap (MapLibre) is drawn with WebGL. A few very old or restricted browsers
 * cannot create a WebGL context: there the map still works, only without the basemap.
 */
export function isWebGLSupported(doc: Document = document): boolean {
  try {
    const canvas = doc.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
