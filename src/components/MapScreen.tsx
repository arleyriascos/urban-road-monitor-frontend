import { useMemo, useState } from 'react';
import { aiServiceUrl } from '../config/env';
import { useRoute } from '../hooks/useRoute';
import { buildSeverityLegend, countPotholes } from '../lib/legend';
import { filterPotholes } from '../lib/potholes';
import { describeRouteError, type RoutePointName } from '../lib/route-errors';
import { groupRouteSteps } from '../lib/route-groups';
import { isPhoneViewport } from '../lib/viewport';
import type { MapData } from '../hooks/useMapData';
import type { LatLng, RouteAnswer, RouteCriterion } from '../types/route';
import { LayerToggles } from './LayerToggles';
import { LegendPanel } from './LegendPanel';
import { MapView, type MapRouting } from './MapView';
import { RecenterButton } from './RecenterButton';
import { RoutePanel } from './RoutePanel';
import { TopBar } from './TopBar';

/** The main screen: the map with its top bar, legend, layer switches and "Cómo llegar". */
export function MapScreen({ data }: { data: MapData }) {
  const [showPotholes, setShowPotholes] = useState(true);
  const [includeRepaired, setIncludeRepaired] = useState(false);
  const [recenterKey, setRecenterKey] = useState(0);
  const [legendOpenAtStart] = useState(() => !isPhoneViewport());

  const [routeOpen, setRouteOpen] = useState(false);
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [criterion, setCriterion] = useState<RouteCriterion>('balanced');
  const { state: routeState, retry, requestKey } = useRoute(origin, destination, criterion);

  // The route street by street, and the street picked in the list. The pick belongs to the
  // route it was made on, so a new route starts without one.
  const route = routeState.status === 'success' ? routeState.route : null;
  const groups = useMemo(() => (route ? groupRouteSteps(route) : []), [route]);
  const [choice, setChoice] = useState<{ route: RouteAnswer; index: number } | null>(null);
  const selected = route && choice?.route === route ? choice.index : null;
  const select = (index: number | null) =>
    setChoice(route && index !== null ? { route, index } : null);

  const visiblePotholes = useMemo(
    () => filterPotholes(data.potholes, { includeRepaired }),
    [data.potholes, includeRepaired],
  );
  const legend = useMemo(() => buildSeverityLegend(data.stats), [data.stats]);
  const potholeCounts = useMemo(() => countPotholes(data.stats), [data.stats]);

  // The first tap places A, the second B; a tap after that starts another route.
  const pick = (point: LatLng) => {
    if (origin && !destination) {
      setDestination(point);
    } else {
      setOrigin(point);
      setDestination(null);
    }
  };
  const move = (which: RoutePointName, point: LatLng) =>
    which === 'origin' ? setOrigin(point) : setDestination(point);
  const clear = () => {
    setOrigin(null);
    setDestination(null);
  };

  const routing: MapRouting | null = routeOpen
    ? {
        origin,
        destination,
        errorPoint:
          routeState.status === 'error'
            ? (describeRouteError(routeState.error).point ?? null)
            : null,
        route,
        highlight: selected !== null ? (groups[selected]?.steps ?? null) : null,
        onPick: pick,
        onMove: move,
      }
    : null;

  return (
    <div className={routeOpen ? 'map-app map-app--routing' : 'map-app'}>
      <TopBar stats={data.stats} />
      <div className="map-app__body">
        <MapView
          segments={data.segments}
          potholes={visiblePotholes}
          showPotholes={showPotholes}
          recenterKey={recenterKey}
          routing={routing}
        />
        {routeOpen ? (
          <RoutePanel
            origin={origin}
            destination={destination}
            criterion={criterion}
            state={routeState}
            requestKey={requestKey}
            groups={groups}
            selected={selected}
            onSelect={select}
            wakeUrl={aiServiceUrl ? `${aiServiceUrl}/health` : null}
            onCriterionChange={setCriterion}
            onRetry={retry}
            onSwap={() => {
              setOrigin(destination);
              setDestination(origin);
            }}
            onClear={clear}
            onClose={() => {
              clear();
              setRouteOpen(false);
            }}
          />
        ) : (
          <button
            type="button"
            className="route-toggle"
            onClick={() => setRouteOpen(true)}
            aria-expanded={false}
          >
            Cómo llegar
          </button>
        )}
        <LegendPanel legend={legend} potholes={potholeCounts} defaultOpen={legendOpenAtStart}>
          <LayerToggles
            showPotholes={showPotholes}
            includeRepaired={includeRepaired}
            repairedCount={potholeCounts.repaired}
            onShowPotholesChange={setShowPotholes}
            onIncludeRepairedChange={setIncludeRepaired}
          />
        </LegendPanel>
        <RecenterButton onClick={() => setRecenterKey((value) => value + 1)} />
      </div>
    </div>
  );
}
