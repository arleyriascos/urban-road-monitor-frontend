import { CAMERA_ERROR_KEYS } from '../camera/camera-error';
import { useLanguage } from '../i18n/useLanguage';
import type { CameraState } from '../hooks/useCamera';
import type { DetectionState } from '../hooks/useDetection';
import type { ModelState } from '../hooks/useDetectorModel';
import { progressFraction } from '../detection/model-download';
import type { PerformanceReading } from '../detection/meters';
import { formatDuration } from '../lib/duration';
import { formatDecimal, formatPercent } from '../lib/format';
import type { Texts } from '../lib/translator';
import type { SendingSummary } from '../sending/status';
import { CameraHeader } from './CameraHeader';
import { Icon } from './Icon';
import { OverlayCanvas } from './OverlayCanvas';
import { PerformanceMeter } from './PerformanceMeter';
import { SendingStatus } from './SendingStatus';
import { SizeMeter } from './SizeMeter';

export interface CameraViewProps {
  camera: CameraState;
  model: ModelState;
  detection: DetectionState;
  /** What to tell the person about saving the potholes. */
  sending: SendingSummary;
  onStart: () => void;
  onStop: () => void;
  /** Gives the page the video element, so the camera can be shown in it and analyzed. */
  videoRef: (video: HTMLVideoElement | null) => void;
}

function modelStatus(model: ModelState, { t, locale }: Texts): string | null {
  if (model.status === 'loading') {
    const fraction = model.progress ? progressFraction(model.progress) : null;
    return fraction === null
      ? t('camera.model.downloading')
      : t('camera.model.downloadingPercent', { percent: formatPercent(fraction, locale) });
  }
  if (model.status === 'error') {
    return t(model.reason === 'failed' ? 'modelError.failed' : 'modelError.unknown');
  }
  return null;
}

/** The speed of the detection over the video, while it runs. The meters below have the detail. */
function LiveBadges({ reading }: { reading: PerformanceReading | null }) {
  const { t, locale } = useLanguage();
  return (
    <div className="camera__badges" aria-hidden="true">
      <span className="camera__badge camera__badge--live">{t('camera.badge.detecting')}</span>
      {reading?.fps != null && (
        <span className="camera__badge">
          {t('camera.badge.perSecond', { value: formatDecimal(reading.fps, 1, locale) })}
        </span>
      )}
      {reading?.totalMs != null && (
        <span className="camera__badge">
          {t('camera.badge.perFrame', { value: formatDuration(reading.totalMs, locale) })}
        </span>
      )}
    </div>
  );
}

/** The screen of the camera: the video with the boxes over it, the two meters and the controls. */
export function CameraView({
  camera,
  model,
  detection,
  sending,
  onStart,
  onStop,
  videoRef,
}: CameraViewProps) {
  const language = useLanguage();
  const { t } = language;
  const on = camera.status === 'on';
  const opening = camera.status === 'opening';
  const status = modelStatus(model, language);
  const ready = model.status === 'ready';

  return (
    <main className="camera">
      <CameraHeader />

      <div className="camera__layout">
        <div className="camera__stage">
          <video
            ref={videoRef}
            className="camera__video"
            autoPlay
            muted
            playsInline
            aria-label={t('camera.video')}
          />
          <OverlayCanvas
            detections={detection.latest?.detections ?? []}
            frame={detection.latest?.frame ?? null}
          />
          {!on && (
            <p className="camera__placeholder">
              <span className="camera__placeholder-icon" aria-hidden="true">
                <Icon name="camera" />
              </span>
              {opening ? t('camera.opening') : t('camera.off')}
            </p>
          )}
          {on && ready && <LiveBadges reading={detection.reading?.performance ?? null} />}
        </div>

        <aside className="camera__side">
          <div className="camera__actions">
            {on || opening ? (
              <button
                type="button"
                className="camera__button camera__button--stop"
                onClick={onStop}
              >
                {t('camera.stop')}
              </button>
            ) : (
              <button type="button" className="camera__button" onClick={onStart}>
                {camera.status === 'error' || model.status === 'error'
                  ? t('camera.retry')
                  : t('camera.start')}
              </button>
            )}
          </div>

          {camera.status === 'error' && (
            <p className="camera__message camera__message--error" role="alert">
              {t(CAMERA_ERROR_KEYS[camera.error.kind])}
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
              {t('camera.searching')}
            </p>
          )}

          <SendingStatus summary={sending} />

          <div className="camera__meters">
            <PerformanceMeter
              reading={detection.reading?.performance ?? null}
              load={ready ? { downloadMs: model.downloadMs, startMs: model.startMs } : null}
            />
            <SizeMeter summary={detection.reading?.size ?? null} />
          </div>

          <p className="camera__privacy">
            <Icon name="shield" />
            <span>{t('camera.privacy')}</span>
          </p>
        </aside>
      </div>
    </main>
  );
}
