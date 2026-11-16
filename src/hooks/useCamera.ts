import { useCallback, useEffect, useRef, useState } from 'react';
import { describeCameraError, type CameraError } from '../camera/camera-error';
import { openCamera, type OpenCamera } from '../camera/open-camera';

export type CameraState =
  | { status: 'off' }
  | { status: 'opening' }
  | { status: 'on'; stream: MediaStream }
  | { status: 'error'; error: CameraError };

export interface CameraDependencies {
  openCamera: () => Promise<OpenCamera>;
}

const defaultDependencies: CameraDependencies = { openCamera: () => openCamera() };

export interface CameraControls {
  state: CameraState;
  start: () => void;
  stop: () => void;
}

/**
 * The camera of the device. It opens only when the person asks (the browser then asks for
 * permission), and it is always turned off when the person leaves the screen.
 */
export function useCamera(dependencies: CameraDependencies = defaultDependencies): CameraControls {
  const [state, setState] = useState<CameraState>({ status: 'off' });
  const current = useRef<OpenCamera | null>(null);
  const attempt = useRef(0);
  const open = dependencies.openCamera;

  const stop = useCallback(() => {
    attempt.current += 1;
    current.current?.stop();
    current.current = null;
    setState({ status: 'off' });
  }, []);

  const start = useCallback(() => {
    if (current.current) return;
    const mine = ++attempt.current;
    setState({ status: 'opening' });
    open().then(
      (camera) => {
        if (mine !== attempt.current) {
          camera.stop();
          return;
        }
        current.current = camera;
        setState({ status: 'on', stream: camera.stream });
      },
      (error: unknown) => {
        if (mine !== attempt.current) return;
        setState({ status: 'error', error: describeCameraError(error) });
      },
    );
  }, [open]);

  useEffect(
    () => () => {
      attempt.current += 1;
      current.current?.stop();
      current.current = null;
    },
    [],
  );

  return { state, start, stop };
}
