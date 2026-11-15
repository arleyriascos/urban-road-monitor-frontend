import { useEffect } from 'react';
import { wakeAiService } from './api/ai-service';
import { MapApp } from './components/MapApp';

/** The whole app. */
export function App() {
  // The AI service sleeps on Render and only a browser can wake it: start now, while the
  // map loads and the person picks two points, so it is usually awake by then.
  useEffect(() => {
    wakeAiService();
  }, []);

  return <MapApp />;
}
