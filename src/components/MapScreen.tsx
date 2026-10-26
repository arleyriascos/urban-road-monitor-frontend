import { useMemo, useState } from 'react';
import { buildSeverityLegend, countPotholes } from '../lib/legend';
import { filterPotholes } from '../lib/potholes';
import { isPhoneViewport } from '../lib/viewport';
import type { MapData } from '../hooks/useMapData';
import { LayerToggles } from './LayerToggles';
import { LegendPanel } from './LegendPanel';
import { MapView } from './MapView';
import { RecenterButton } from './RecenterButton';
import { TopBar } from './TopBar';

/** The main screen: the map with its top bar, legend and layer switches. */
export function MapScreen({ data }: { data: MapData }) {
  const [showPotholes, setShowPotholes] = useState(true);
  const [includeRepaired, setIncludeRepaired] = useState(false);
  const [recenterKey, setRecenterKey] = useState(0);
  const [legendOpenAtStart] = useState(() => !isPhoneViewport());

  const visiblePotholes = useMemo(
    () => filterPotholes(data.potholes, { includeRepaired }),
    [data.potholes, includeRepaired],
  );
  const legend = useMemo(() => buildSeverityLegend(data.stats), [data.stats]);
  const potholeCounts = useMemo(() => countPotholes(data.stats), [data.stats]);

  return (
    <div className="map-app">
      <TopBar stats={data.stats} />
      <div className="map-app__body">
        <MapView
          segments={data.segments}
          potholes={visiblePotholes}
          showPotholes={showPotholes}
          recenterKey={recenterKey}
        />
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
