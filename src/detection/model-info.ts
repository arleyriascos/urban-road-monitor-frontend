/**
 * What the pothole model expects and gives. These are the facts of the exported file
 * (public/models/pothole/best.onnx): if the model is trained or exported again with other
 * settings, change them here and nowhere else.
 */

/** Address of the model. The app serves it itself, as a static file. */
export const MODEL_URL = '/models/pothole/best.onnx';

/** Address of the folder with the WebAssembly engine (see scripts/copy-ort.mjs). */
export const WASM_FOLDER = '/ort/';

/** The model looks at a square picture of this many pixels per side. */
export const MODEL_INPUT_SIZE = 416;

/** Names of the input and the output of the network. */
export const MODEL_INPUT_NAME = 'images';
export const MODEL_OUTPUT_NAME = 'output0';

/**
 * Each of the three scales of the network (strides 8, 16 and 32) gives one candidate per
 * cell: 52 x 52 + 26 x 26 + 13 x 13 = 3549 candidates for a 416 pixel picture.
 */
export const MODEL_CANDIDATES = [8, 16, 32].reduce(
  (total, stride) => total + (MODEL_INPUT_SIZE / stride) ** 2,
  0,
);

/** The rows of the output: the center x, the center y, the width, the height and one score. */
export const MODEL_OUTPUT_ROWS = 5;

/** A candidate needs at least this score to count as a pothole. */
export const SCORE_THRESHOLD = 0.4;

/** Two boxes that overlap more than this are the same pothole: only the best one stays. */
export const NMS_IOU_THRESHOLD = 0.5;

/** The most potholes kept in one picture. */
export const MAX_DETECTIONS = 20;
