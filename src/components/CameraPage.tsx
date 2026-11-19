import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { useCamera, type CameraDependencies } from '../hooks/useCamera';
import { useDetection, type DetectionDependencies } from '../hooks/useDetection';
import { useDetectionSending, type SendingDependencies } from '../hooks/useDetectionSending';
import { useDetectorModel, type ModelDependencies } from '../hooks/useDetectorModel';
import { useGeolocation, type GeolocationDependencies } from '../hooks/useGeolocation';
import { useSendAccess, type SendAccessDependencies } from '../hooks/useSendAccess';
import { sessionStore, type SessionStore } from '../lib/session-storage';
import { summarizeSending } from '../sending/status';
import { CameraGate } from './CameraGate';
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
  /** What the guest's button does: forget the guest choice and go to the entry screen. */
  gate?: GateDependencies;
}

export interface GateDependencies {
  store: Pick<SessionStore, 'clearGuest'>;
  goTo: (path: string) => void;
}

const defaultGate: GateDependencies = {
  store: sessionStore,
  goTo: (path) => window.location.assign(path),
};

/** Plays the camera in the video, or empties it when the camera is off. */
function showStream(video: HTMLVideoElement, stream: MediaStream | null): void {
  video.srcObject = stream;
  if (stream) void video.play().catch(() => undefined);
}

/**
 * The camera screen. The camera and the model start together when the person asks, the video
 * plays the camera, and the detector runs on it once both are ready. The detections of a signed-in
 * account are kept with the GPS position and sent. A guest has nobody to save them for, so the
 * camera is replaced by a screen that asks to sign in.
 */
export function CameraPage({ dependencies = {} }: { dependencies?: CameraPageDependencies }) {
  const language = useLanguage();
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
  const summary = summarizeSending(access, geolocation.state, sending, stream !== null, language);
  const gate = dependencies.gate ?? defaultGate;

  const { start: startCamera, stop: stopCamera } = camera;
  const { load: loadModel } = model;
  const start = useCallback(() => {
    startCamera();
    loadModel();
  }, [startCamera, loadModel]);

  // Nothing is asked of the device for a guest: the camera and the model only start from the
  // button of the camera view, which is not shown here.
  if (access.status === 'guest') {
    return (
      <CameraGate
        onSignIn={() => {
          // The map shows the entry screen to whoever has no session and did not choose to be a guest.
          gate.store.clearGuest();
          gate.goTo('/');
        }}
      />
    );
  }

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
