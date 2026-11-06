import { useEffect } from 'react';
import { wakeAiService } from './api/ai-service';
import { ErrorScreen } from './components/ErrorScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { MapScreen } from './components/MapScreen';
import { useMapData } from './hooks/useMapData';

/** Loads the map data and shows the loading, error or result screen. */
export function App() {
  const { state, retry } = useMapData();

  // The AI service sleeps on Render and only a browser can wake it: start now, while the
  // map loads and the person picks two points, so it is usually awake by then.
  useEffect(() => {
    wakeAiService();
  }, []);

  if (state.status === 'loading') return <LoadingScreen slow={state.slow} />;
  if (state.status === 'error') return <ErrorScreen error={state.error} onRetry={retry} />;
  return <MapScreen data={state.data} />;
}
