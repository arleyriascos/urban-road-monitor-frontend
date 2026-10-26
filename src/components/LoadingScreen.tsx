import { ConnectionRoute } from './ConnectionRoute';

/** Shown while the map data is on its way. The road shows where the request is. */
export function LoadingScreen({ slow }: { slow: boolean }) {
  return (
    <main className="splash">
      <section className="panel splash__card" aria-live="polite" aria-busy="true">
        <p className="splash__brand">Urban Road Monitor</p>
        <ConnectionRoute state={{ status: 'loading' }} />
        <div className="status status--loading">
          <p className="status__title">Cargando el mapa…</p>
          <p className="status__help">
            Estamos trayendo las calles de Pasto y el estado de cada una.
          </p>
          {slow && (
            <p className="status__help">
              El servidor gratuito se duerme cuando nadie lo usa. Está despertando y puede tardar
              hasta un minuto.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
