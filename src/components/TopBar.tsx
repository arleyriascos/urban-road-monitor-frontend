import { summarizeNetwork } from '../lib/legend';
import type { NetworkStats } from '../types/map';

/** Title of the app and the numbers of the city. */
export function TopBar({ stats }: { stats: NetworkStats }) {
  const summary = summarizeNetwork(stats);

  return (
    <header className="topbar">
      <div>
        <p className="topbar__brand">Urban Road Monitor</p>
        <h1 className="topbar__title">Estado de las calles de Pasto</h1>
      </div>
      <p className="topbar__summary">
        {summary.roads} · {summary.length} · {summary.potholes}
      </p>
    </header>
  );
}
