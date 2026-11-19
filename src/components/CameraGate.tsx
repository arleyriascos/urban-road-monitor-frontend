import { useLanguage } from '../i18n/useLanguage';
import { CameraHeader } from './CameraHeader';
import { Icon } from './Icon';

/**
 * What a guest sees in place of the camera. Detecting potholes only makes sense with an
 * account, because what the camera finds is saved under the name of whoever is signed in; so
 * the person is asked to sign in, or to go back to the map, which a guest can use freely.
 */
export function CameraGate({ onSignIn }: { onSignIn: () => void }) {
  const { t } = useLanguage();
  return (
    <main className="camera">
      <CameraHeader />

      <section className="camera__gate" aria-label={t('camera.gate.label')}>
        <span className="camera__gate-icon" aria-hidden="true">
          <Icon name="shield" />
        </span>
        <p className="camera__gate-lead">{t('camera.gate.lead')}</p>
        <p className="camera__privacy">{t('camera.gate.privacy')}</p>
        <div className="camera__actions">
          <button type="button" className="camera__button" onClick={onSignIn}>
            {t('camera.gate.signIn')}
          </button>
        </div>
      </section>
    </main>
  );
}
