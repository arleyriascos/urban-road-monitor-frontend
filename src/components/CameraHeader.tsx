import { useLanguage } from '../i18n/useLanguage';
import { BrandMark } from './BrandMark';
import { Icon } from './Icon';

/** The bar on top of the camera screens: the way back to the map and the name of the screen. */
export function CameraHeader() {
  const { t } = useLanguage();
  return (
    <header className="camera__header">
      <a className="camera__back" href="/">
        <Icon name="chevronLeft" />
        <span>{t('camera.back')}</span>
      </a>
      <div className="camera__heading">
        <BrandMark>
          <Icon name="camera" />
        </BrandMark>
        <div>
          <h1 className="camera__title">{t('camera.title')}</h1>
          <p className="camera__subtitle">{t('camera.subtitle')}</p>
        </div>
      </div>
    </header>
  );
}
