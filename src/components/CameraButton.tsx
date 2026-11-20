import { useLanguage } from '../i18n/useLanguage';
import { CAMERA_PATH } from './CameraPage';
import { Icon } from './Icon';

/** The way to the pothole detector: a round camera button at the bottom right of the map. */
export function CameraButton() {
  const { t } = useLanguage();
  return (
    <a
      className="camera-fab"
      href={CAMERA_PATH}
      aria-label={t('map.camera')}
      title={t('map.camera')}
    >
      <Icon name="camera" />
      <span className="camera-fab__hint" aria-hidden="true">
        {t('map.cameraHint')}
      </span>
    </a>
  );
}
