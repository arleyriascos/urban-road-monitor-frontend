import { useCallback, useEffect, useState } from 'react';
import { useCamera, type CameraDependencies } from '../hooks/useCamera';
import { useDetection, type DetectionDependencies } from '../hooks/useDetection';
import { useDetectionSending, type SendingDependencies } from '../hooks/useDetectionSending';
import { useDetectorModel, type ModelDependencies } from '../hooks/useDetectorModel';
import { useGeolocation, type GeolocationDependencies } from '../hooks/useGeolocation';
import { useSendAccess, type SendAccessDependencies } from '../hooks/useSendAccess';
import { summarizeSending } from '../sending/status';
import { CameraView } from './CameraView';

/** The address of the camera screen. The host rewrites every path to the app. */
export const CAMERA_PATH = '/camara';

export interface CameraPageDependencies {
  camera?: CameraDependencies;
  model?: ModelDependencies;
  detection?: DetectionDependencies;
  access?: SendAccessDependencies;
  geolocation?: GeolocationDependencies;
  sending?: SendingDependencies;
}

/** Plays the camera in the video, or empties it when the camera is off. */
function showStream(video: HTMLVideoElement, stream: MediaStream | null): void {
  video.srcObject = stream;
  if (stream) void video.play().catch(() => undefined);
}

/**
 * The camera screen. The camera and the model start together when the person asks, the video
 * plays the camera, and the detector runs on it once both are ready. A collaborator's
 * detections are kept with the GPS position and sent; a guest only sees the boxes.
 */
export function CameraPage({ dependencies = {} }: { dependencies?: CameraPageDependencies }) {
  const camera = useCamera(dependencies.camera);
  const model = useDetectorModel(dependencies.model);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);

  const stream = camera.state.status === 'on' ? camera.state.stream : null;
  useEffect(() => {
    if (!video) return;
    showStream(video, stream);
  }, [video, stream]);

  const detector = model.state.status === 'ready' ? model.state.detector : null;
  const detection = useDetection(detector, video, stream !== null, dependencies.detection);

  const access = useSendAccess(dependencies.access);
  const recording = access.status === 'allowed';
  const geolocation = useGeolocation(stream !== null && recording, dependencies.geolocation);
  const sending = useDetectionSending(
    access,
    stream !== null,
    detection,
    geolocation,
    dependencies.sending,
  );
  const summary = summarizeSending(access, geolocation.state, sending, stream !== null);

  const { start: startCamera, stop: stopCamera } = camera;
  const { load: loadModel } = model;
  const start = useCallback(() => {
    startCamera();
    loadModel();
  }, [startCamera, loadModel]);

  return (
    <CameraView
      camera={camera.state}
      model={model.state}
      detection={detection}
      sending={summary}
      onStart={start}
      onStop={stopCamera}
      videoRef={setVideo}
    />
  );
}
