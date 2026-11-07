import { useEffect, useState, type ComponentProps } from 'react';
import { MAX_WAKE_ATTEMPTS, type RouteState } from '../hooks/useRoute';
import { describeRouteError } from '../lib/route-errors';
import type { RouteGroup } from '../lib/route-groups';
import type { LatLng, RouteCriterion } from '../types/route';
import { CriterionPicker } from './CriterionPicker';
import { RouteDetails } from './RouteDetails';
import { RouteSteps } from './RouteSteps';

interface RoutePanelProps {
  origin: LatLng | null;
  destination: LatLng | null;
  criterion: RouteCriterion;
  state: RouteState;
  /** Changes with every request, so a repeated error starts its countdown again. */
  requestKey?: string;
  /** Address that wakes the route service in a new tab, or null when it is not configured. */
  wakeUrl: string | null;
  /** The route street by street, and the street picked (null when none is). */
  groups?: readonly RouteGroup[];
  selected?: number | null;
  onSelect?: (index: number | null) => void;
  /** Asks for the same route again with the other algorithm; replaced in tests. */
  fetchRoute?: ComponentProps<typeof RouteDetails>['fetchRoute'];
  onCriterionChange: (value: RouteCriterion) => void;
  onRetry: () => void;
  onSwap: () => void;
  onClear: () => void;
  onClose: () => void;
}

function hint(origin: LatLng | null, destination: LatLng | null): string {
  if (!origin) return 'Toca el mapa para poner el origen (A).';
  if (!destination) return 'Ahora toca el mapa para poner el destino (B).';
  return 'Arrastra A o B para moverlos, o toca el mapa para empezar otra ruta.';
}

/** "Reintentar", which waits the seconds the server asked for before it can be used. */
function RetryButton({ waitS = 0, onRetry }: { waitS?: number; onRetry: () => void }) {
  const [left, setLeft] = useState(Math.ceil(waitS));
  const counting = left > 0;

  useEffect(() => {
    if (!counting) return;
    const timer = window.setInterval(() => setLeft((value) => (value <= 1 ? 0 : value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [counting]);

  return (
    <button type="button" className="route-button" onClick={onRetry} disabled={counting}>
      {counting ? `Reintentar en ${left} s` : 'Reintentar'}
    </button>
  );
}

function RouteStatus({
  state,
  requestKey = '',
  wakeUrl,
  onRetry,
}: Pick<RoutePanelProps, 'state' | 'requestKey' | 'wakeUrl' | 'onRetry'>) {
  switch (state.status) {
    case 'idle':
      return null;
    case 'loading':
      return (
        <p className="route-status" role="status">
          Calculando la ruta…
        </p>
      );
    case 'waking':
      return (
        <div className="route-status" role="status">
          <p className="route-status__title">Despertando el servicio de rutas…</p>
          <p className="route-status__help">
            Duerme tras un rato sin uso y puede tardar hasta un minuto. Intento {state.attempt} de{' '}
            {MAX_WAKE_ATTEMPTS}.
          </p>
        </div>
      );
    case 'success':
      return (
        <p className="route-status route-status--ok" role="status">
          Ruta lista.
          {state.route.fromCache ? (
            <span className="route-status__note"> Salió de la caché.</span>
          ) : null}
        </p>
      );
    case 'error': {
      const description = describeRouteError(state.error);
      return (
        <div className="route-status route-status--error" role="alert">
          <p className="route-status__title">{description.title}</p>
          <p className="route-status__help">{description.help}</p>
          <div className="route-panel__actions">
            {description.retryable ? (
              <RetryButton key={requestKey} waitS={description.waitS} onRetry={onRetry} />
            ) : null}
            {description.wakeLink && wakeUrl ? (
              <a className="route-link" href={wakeUrl} target="_blank" rel="noopener noreferrer">
                Despertar el servicio de rutas
              </a>
            ) : null}
          </div>
        </div>
      );
    }
  }
}

/** The "Cómo llegar" panel: how to place the points, the criterion and the state of the route. */
export function RoutePanel(props: RoutePanelProps) {
  const { origin, destination, criterion, onCriterionChange, onSwap, onClear, onClose } = props;
  const { groups = [], selected = null, onSelect = () => undefined } = props;

  return (
    <section className="route-panel" aria-label="Cómo llegar">
      <div className="route-panel__header">
        <h2 className="route-panel__title">Cómo llegar</h2>
        <button
          type="button"
          className="route-panel__close"
          onClick={onClose}
          aria-label="Cerrar Cómo llegar"
        >
          ×
        </button>
      </div>
      <p className="route-panel__hint">{hint(origin, destination)}</p>
      <CriterionPicker value={criterion} onChange={onCriterionChange} />
      <RouteStatus
        state={props.state}
        requestKey={props.requestKey}
        wakeUrl={props.wakeUrl}
        onRetry={props.onRetry}
      />
      {props.state.status === 'success' && origin && destination ? (
        <>
          <RouteDetails
            route={props.state.route}
            groups={groups}
            origin={origin}
            destination={destination}
            criterion={criterion}
            fetchRoute={props.fetchRoute}
          />
          <RouteSteps groups={groups} selected={selected} onSelect={onSelect} />
        </>
      ) : null}
      <div className="route-panel__actions">
        <button
          type="button"
          className="route-button route-button--quiet"
          onClick={onSwap}
          disabled={!origin || !destination}
        >
          Intercambiar A y B
        </button>
        <button
          type="button"
          className="route-button route-button--quiet"
          onClick={onClear}
          disabled={!origin && !destination}
        >
          Limpiar
        </button>
      </div>
    </section>
  );
}
