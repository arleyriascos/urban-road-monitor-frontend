import { ErrorScreen } from './components/ErrorScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { MapScreen } from './components/MapScreen';
import { useMapData } from './hooks/useMapData';

/** Loads the map data and shows the loading, error or result screen. */
export function App() {
  const { state, retry } = useMapData();

  if (state.status === 'loading') return <LoadingScreen slow={state.slow} />;
  if (state.status === 'error') return <ErrorScreen error={state.error} onRetry={retry} />;
  return <MapScreen data={state.data} />;
}
