import { summarizeNetwork } from '../lib/legend';
import type { NetworkStats } from '../types/map';
import { AccountBadge, type AccountActions } from './AccountBadge';

/** Title of the app, the numbers of the city and, when given, who is using it. */
export function TopBar({ stats, account }: { stats: NetworkStats; account?: AccountActions }) {
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
      {account && <AccountBadge {...account} />}
    </header>
  );
}
