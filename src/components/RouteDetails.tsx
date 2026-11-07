import { useState } from 'react';
import { ApiError } from '../api/http';
import { getRoute, type RouteQuery } from '../api/routes';
import { formatDecimal, formatLength, formatNumber, formatPercent } from '../lib/format';
import { CRITERIA } from '../lib/route-criteria';
import { describeRouteError } from '../lib/route-errors';
import { countDamagedSteps, type RouteGroup } from '../lib/route-groups';
import type { LatLng, RouteAlgorithm, RouteAnswer, RouteCriterion } from '../types/route';

const ALGORITHM_NAME: Record<RouteAlgorithm, string> = { astar: 'A*', dijkstra: 'Dijkstra' };

type FetchRoute = (query: RouteQuery, signal?: AbortSignal) => Promise<RouteAnswer>;

type Comparison =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; other: RouteAnswer }
  | { status: 'error'; error: ApiError };

interface RouteDetailsProps {
  route: RouteAnswer;
  groups: readonly RouteGroup[];
  origin: LatLng;
  destination: LatLng;
  criterion: RouteCriterion;
  /** Asks for the same route again; replaced in tests. */
  fetchRoute?: FetchRoute;
}

function ComparisonResult({ route, other }: { route: RouteAnswer; other: RouteAnswer }) {
  const rows = [route, other].sort((a, b) => a.algorithm.localeCompare(b.algorithm));
  const astar = rows.find((row) => row.algorithm === 'astar');
  const dijkstra = rows.find((row) => row.algorithm === 'dijkstra');
  const sameCost =
    astar && dijkstra ? Math.abs(astar.summary.cost - dijkstra.summary.cost) < 0.01 : false;
  const share =
    astar && dijkstra && dijkstra.summary.exploredNodes > 0
      ? astar.summary.exploredNodes / dijkstra.summary.exploredNodes
      : null;

  return (
    <div className="route-compare__result">
      <table className="route-compare__table">
        <thead>
          <tr>
            <th scope="col">Algoritmo</th>
            <th scope="col">Nodos explorados</th>
            <th scope="col">Tiempo</th>
            <th scope="col">Costo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.algorithm}>
              <th scope="row">{ALGORITHM_NAME[row.algorithm]}</th>
              <td>{formatNumber(row.summary.exploredNodes)}</td>
              <td>{row.summary.computationMs} ms</td>
              <td>{formatDecimal(row.summary.cost, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="route-compare__note">
        {sameCost
          ? 'Los dos algoritmos dan el mismo costo: la ruta es igual de buena.'
          : 'Los costos no coinciden; revisa el resultado.'}
        {share !== null
          ? ` A* exploró el ${formatPercent(share)} de los nodos que exploró Dijkstra.`
          : ''}
      </p>
    </div>
  );
}

/** Asks for the same route with the other algorithm and puts the two side by side. */
function AlgorithmComparison({
  route,
  query,
  fetchRoute,
}: {
  route: RouteAnswer;
  query: Omit<RouteQuery, 'algorithm'>;
  fetchRoute: FetchRoute;
}) {
  // The answer is kept with the route it belongs to, so a new route starts without one.
  const [stored, setStored] = useState<{ route: RouteAnswer; state: Comparison } | null>(null);
  const state: Comparison = stored?.route === route ? stored.state : { status: 'idle' };
  const otherAlgorithm: RouteAlgorithm = route.algorithm === 'astar' ? 'dijkstra' : 'astar';

  const compare = () => {
    setStored({ route, state: { status: 'loading' } });
    fetchRoute({ ...query, algorithm: otherAlgorithm })
      .then((other) => setStored({ route, state: { status: 'done', other } }))
      .catch((error: unknown) =>
        setStored({
          route,
          state: {
            status: 'error',
            error: error instanceof ApiError ? error : new ApiError('network', 'Unexpected error'),
          },
        }),
      );
  };

  return (
    <div className="route-compare">
      <button
        type="button"
        className="route-button route-button--quiet"
        onClick={compare}
        disabled={state.status === 'loading'}
      >
        {state.status === 'done'
          ? 'Comparar de nuevo'
          : `Comparar con ${ALGORITHM_NAME[otherAlgorithm]}`}
      </button>
      {state.status === 'loading' ? (
        <p className="route-compare__note" role="status">
          Calculando con {ALGORITHM_NAME[otherAlgorithm]}…
        </p>
      ) : null}
      {state.status === 'error' ? (
        <p className="route-compare__note route-compare__note--error" role="alert">
          {describeRouteError(state.error).title}
        </p>
      ) : null}
      {state.status === 'done' ? <ComparisonResult route={route} other={state.other} /> : null}
    </div>
  );
}

/** The numbers of the route, and the technical details with the algorithm comparison. */
export function RouteDetails({
  route,
  groups,
  origin,
  destination,
  criterion,
  fetchRoute = getRoute,
}: RouteDetailsProps) {
  const { summary } = route;
  const criterionLabel = CRITERIA.find((item) => item.value === criterion)?.label ?? criterion;

  return (
    <div className="route-info">
      <dl className="route-summary">
        <div>
          <dt>Distancia</dt>
          <dd>{formatLength(summary.lengthM)}</dd>
        </div>
        <div>
          <dt>Calles</dt>
          <dd>{formatNumber(groups.length)}</dd>
        </div>
        <div>
          <dt>Tramos</dt>
          <dd>{formatNumber(summary.steps)}</dd>
        </div>
        <div>
          <dt>Con daño</dt>
          <dd>
            {formatNumber(countDamagedSteps(groups))} de {formatNumber(summary.steps)}
          </dd>
        </div>
      </dl>
      <details className="route-details">
        <summary>Detalles técnicos</summary>
        <dl className="route-facts">
          <dt>Criterio</dt>
          <dd>{criterionLabel}</dd>
          <dt>Algoritmo</dt>
          <dd>{ALGORITHM_NAME[route.algorithm]}</dd>
          <dt>Nodos explorados</dt>
          <dd>{formatNumber(summary.exploredNodes)}</dd>
          <dt>Tiempo de cálculo</dt>
          <dd>{summary.computationMs} ms</dd>
          <dt>Costo de la ruta</dt>
          <dd>{formatDecimal(summary.cost, 1)}</dd>
          <dt>Salió de la caché</dt>
          <dd>{route.fromCache ? 'Sí' : 'No'}</dd>
        </dl>
        <AlgorithmComparison
          route={route}
          query={{ origin, destination, criterion }}
          fetchRoute={fetchRoute}
        />
      </details>
    </div>
  );
}
