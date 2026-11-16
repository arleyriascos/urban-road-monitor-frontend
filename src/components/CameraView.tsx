import type { CameraState } from '../hooks/useCamera';
import type { DetectionState } from '../hooks/useDetection';
import type { ModelState } from '../hooks/useDetectorModel';
import { progressFraction } from '../detection/model-download';
import { formatPercent } from '../lib/format';
import { OverlayCanvas } from './OverlayCanvas';
import { PerformanceMeter } from './PerformanceMeter';
import { SizeMeter } from './SizeMeter';

export interface CameraViewProps {
  camera: CameraState;
  model: ModelState;
  detection: DetectionState;
  onStart: () => void;
  onStop: () => void;
  /** Gives the page the video element, so the camera can be shown in it and analyzed. */
  videoRef: (video: HTMLVideoElement | null) => void;
}

function modelStatus(model: ModelState): string | null {
  if (model.status === 'loading') {
    const fraction = model.progress ? progressFraction(model.progress) : null;
    return fraction === null
      ? 'Descargando el modelo de detección…'
      : `Descargando el modelo de detección: ${formatPercent(fraction)}`;
  }
  if (model.status === 'error') return model.message;
  return null;
}

/** The screen of the camera: the video with the boxes over it, the two meters and the controls. */
export function CameraView({
  camera,
  model,
  detection,
  onStart,
  onStop,
  videoRef,
}: CameraViewProps) {
  const on = camera.status === 'on';
  const opening = camera.status === 'opening';
  const status = modelStatus(model);
  const ready = model.status === 'ready';

  return (
    <main className="camera">
      <header className="camera__header">
        <a className="camera__back" href="/">
          Volver al mapa
        </a>
        <h1 className="camera__title">Detector de baches</h1>
      </header>

      <p className="camera__privacy">
        Las imágenes de la cámara se analizan en tu dispositivo y no salen de él. Por ahora no se
        guarda nada.
      </p>

      <div className="camera__stage">
        <video
          ref={videoRef}
          className="camera__video"
          autoPlay
          muted
          playsInline
          aria-label="Vista de la cámara"
        />
        <OverlayCanvas
          detections={detection.latest?.detections ?? []}
          frame={detection.latest?.frame ?? null}
        />
        {!on && (
          <p className="camera__placeholder">
            {opening ? 'Abriendo la cámara…' : 'La cámara está apagada.'}
          </p>
        )}
      </div>

      {camera.status === 'error' && (
        <p className="camera__message camera__message--error" role="alert">
          {camera.error.message}
        </p>
      )}
      {status && (
        <p
          className={`camera__message${model.status === 'error' ? ' camera__message--error' : ''}`}
          role={model.status === 'error' ? 'alert' : 'status'}
        >
          {status}
        </p>
      )}
      {on && ready && !detection.latest && (
        <p className="camera__message" role="status">
          Buscando baches…
        </p>
      )}

      <div className="camera__actions">
        {on || opening ? (
          <button type="button" className="camera__button camera__button--stop" onClick={onStop}>
            Apagar la cámara
          </button>
        ) : (
          <button type="button" className="camera__button" onClick={onStart}>
            {camera.status === 'error' || model.status === 'error'
              ? 'Intentar de nuevo'
              : 'Activar la cámara'}
          </button>
        )}
      </div>

      <div className="camera__meters">
        <PerformanceMeter
          reading={detection.reading?.performance ?? null}
          load={ready ? { downloadMs: model.downloadMs, startMs: model.startMs } : null}
        />
        <SizeMeter summary={detection.reading?.size ?? null} />
      </div>
    </main>
  );
}
