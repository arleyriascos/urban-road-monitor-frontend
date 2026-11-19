import { useLanguage } from '../i18n/useLanguage';
import { summarizeNetwork } from '../lib/legend';
import type { NetworkStats } from '../types/map';
import { CAMERA_PATH } from './CameraPage';
import { AccountBadge, type AccountActions } from './AccountBadge';
import { BrandMark } from './BrandMark';
import { Icon } from './Icon';

/** A number and what it counts, such as "4.610 vías": the number goes in bold. */
function Figure({ text }: { text: string }) {
  const space = text.indexOf(' ');
  if (space === -1) return <li className="topbar__chip">{text}</li>;
  return (
    <li className="topbar__chip">
      <b>{text.slice(0, space)}</b>
      {text.slice(space)}
    </li>
  );
}

/** Title of the app, the numbers of the city and, when given, who is using it. */
export function TopBar({ stats, account }: { stats: NetworkStats; account?: AccountActions }) {
  const language = useLanguage();
  const { t } = language;
  const summary = summarizeNetwork(stats, language);

  return (
    <header className="topbar">
      <a className="brand topbar__brand" href="/">
        <BrandMark />
        <span className="brand__text">
          <span className="brand__name">Urban Road Monitor</span>
          <h1 className="brand__sub topbar__title">{t('topbar.title')}</h1>
        </span>
      </a>
      <ul className="topbar__summary" aria-label={t('topbar.summary')}>
        <Figure text={summary.roads} />
        <Figure text={summary.length} />
        <Figure text={summary.potholes} />
      </ul>
      <a className="topbar__camera" href={CAMERA_PATH}>
        <Icon name="camera" />
        <span className="topbar__camera-text">{t('topbar.camera')}</span>
      </a>
      {account && <AccountBadge {...account} />}
    </header>
  );
}
