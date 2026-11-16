/** A rectangle in pixels: the top-left corner and the size. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A pothole the model found: where it is and how sure the model is (0 to 1). */
export interface Detection extends Box {
  score: number;
}

/** The size of a picture in pixels. */
export interface FrameSize {
  width: number;
  height: number;
}
