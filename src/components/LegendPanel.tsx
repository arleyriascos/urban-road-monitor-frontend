import { useId, useState, type ReactNode } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { formatNumber } from '../lib/format';
import type { LegendEntry, PotholeCounts } from '../lib/legend';
import { Icon } from './Icon';

interface LegendPanelProps {
  legend: LegendEntry[];
  potholes: PotholeCounts;
  /** On phones the panel starts folded so it does not cover the map. */
  defaultOpen?: boolean;
  children?: ReactNode;
}

/** Foldable panel with the colors of the map, the pothole numbers and the layer switches. */
export function LegendPanel({ legend, potholes, defaultOpen = true, children }: LegendPanelProps) {
  const { t, locale } = useLanguage();
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  const total = legend.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <aside className="legend" aria-label={t('legend.label')}>
      <button
        type="button"
        className="legend__toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="legend__title">
          <Icon name="layers" />
          {t('legend.title')}
        </span>
        <span className="legend__dots" aria-hidden="true">
          {legend.map((entry) => (
            <span key={entry.severity} style={{ background: entry.color }} />
          ))}
        </span>
        <span className={open ? 'legend__chevron legend__chevron--open' : 'legend__chevron'}>
          <Icon name="chevronDown" />
        </span>
      </button>

      {open && (
        <div id={bodyId} className="legend__body">
          <h2 className="legend__heading">{t('legend.streets')}</h2>
          {total > 0 && (
            <div className="legend__bar" aria-hidden="true">
              {legend.map((entry) => (
                <span
                  key={entry.severity}
                  style={{ flexGrow: entry.count, background: entry.color }}
                />
              ))}
            </div>
          )}
          <ul className="legend__list">
            {legend.map((entry) => (
              <li key={entry.severity} className="legend__item">
                <span
                  className="legend__swatch"
                  style={{ background: entry.color }}
                  aria-hidden="true"
                />
                <span className="legend__label">{entry.label}</span>
                <span className="legend__count">{entry.countLabel}</span>
              </li>
            ))}
          </ul>

          <h2 className="legend__heading">{t('legend.potholes')}</h2>
          <ul className="legend__list">
            <li className="legend__item">
              <span className="legend__circle" aria-hidden="true" />
              <span className="legend__label">{t('legend.confirmed')}</span>
              <span className="legend__count">{formatNumber(potholes.confirmed, locale)}</span>
            </li>
            <li className="legend__item">
              <span className="legend__circle legend__circle--unconfirmed" aria-hidden="true" />
              <span className="legend__label">{t('legend.unconfirmed')}</span>
              <span className="legend__count">{formatNumber(potholes.unconfirmed, locale)}</span>
            </li>
            <li className="legend__item">
              <span className="legend__circle legend__circle--repaired" aria-hidden="true" />
              <span className="legend__label">{t('legend.repaired')}</span>
              <span className="legend__count">{formatNumber(potholes.repaired, locale)}</span>
            </li>
          </ul>
          <p className="legend__note">{t('legend.noteSize')}</p>
          <p className="legend__note">{t('legend.noteConfirmed')}</p>

          {children}
        </div>
      )}
    </aside>
  );
}
