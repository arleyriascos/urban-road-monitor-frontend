/** What a camera gives once it is open: the stream and a way to turn it off. */
export interface OpenCamera {
  stream: MediaStream;
  stop(): void;
}

/** The part of the browser that opens the camera (so the tests can replace it). */
export interface MediaDevicesLike {
  getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
}

/**
 * What the app asks of the camera: the rear one when there is one, and a picture around 720p,
 * which is plenty for a model that looks at 416 pixels and keeps the phone cool.
 */
export const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
};

function defaultMediaDevices(): MediaDevicesLike | null {
  return typeof navigator !== 'undefined' && navigator.mediaDevices ? navigator.mediaDevices : null;
}

/** Opens the camera. Throws the browser's own error when it cannot (denied, none, busy...). */
export async function openCamera(
  mediaDevices: MediaDevicesLike | null = defaultMediaDevices(),
): Promise<OpenCamera> {
  if (!mediaDevices) {
    throw new DOMException('This browser has no camera access', 'NotSupportedError');
  }
  const stream = await mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
  return {
    stream,
    stop() {
      stream.getTracks().forEach((track) => track.stop());
    },
  };
}
