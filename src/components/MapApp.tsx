import { useMapData } from '../hooks/useMapData';
import type { AccountActions } from './AccountBadge';
import { ErrorScreen } from './ErrorScreen';
import { LoadingScreen } from './LoadingScreen';
import { MapScreen } from './MapScreen';

/** Loads the map data and shows the loading, error or result screen. */
export function MapApp({ account }: { account?: AccountActions }) {
  const { state, retry } = useMapData();

  if (state.status === 'loading') return <LoadingScreen slow={state.slow} />;
  if (state.status === 'error') return <ErrorScreen error={state.error} onRetry={retry} />;
  return <MapScreen data={state.data} account={account} />;
}
