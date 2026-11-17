import { CameraHeader } from './CameraHeader';
import { Icon } from './Icon';

/**
 * What a guest sees in place of the camera. Detecting potholes only makes sense with an
 * account, because what the camera finds is saved under the name of whoever is signed in; so
 * the person is asked to sign in, or to go back to the map, which a guest can use freely.
 */
export function CameraGate({ onSignIn }: { onSignIn: () => void }) {
  return (
    <main className="camera">
      <CameraHeader />

      <section className="camera__gate" aria-label="Ingreso necesario">
        <span className="camera__gate-icon" aria-hidden="true">
          <Icon name="shield" />
        </span>
        <p className="camera__gate-lead">
          Para detectar baches y guardarlos necesitas ingresar con tu cuenta de Google.
        </p>
        <p className="camera__privacy">
          Como invitado puedes ver el mapa, buscar calles y trazar rutas. Las imágenes de la cámara
          nunca salen de tu dispositivo: solo se envía dónde está cada bache y qué tan grande se ve.
        </p>
        <div className="camera__actions">
          <button type="button" className="camera__button" onClick={onSignIn}>
            Ingresar con Google
          </button>
        </div>
      </section>
    </main>
  );
}
