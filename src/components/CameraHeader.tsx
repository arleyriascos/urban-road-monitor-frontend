import { BrandMark } from './BrandMark';
import { Icon } from './Icon';

/** The bar on top of the camera screens: the way back to the map and the name of the screen. */
export function CameraHeader() {
  return (
    <header className="camera__header">
      <a className="camera__back" href="/">
        <Icon name="chevronLeft" />
        <span>Volver al mapa</span>
      </a>
      <div className="camera__heading">
        <BrandMark>
          <Icon name="camera" />
        </BrandMark>
        <div>
          <h1 className="camera__title">Detector de baches</h1>
          <p className="camera__subtitle">El modelo corre en tu dispositivo</p>
        </div>
      </div>
    </header>
  );
}
