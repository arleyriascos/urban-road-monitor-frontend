import { useId, useState, type ReactNode } from 'react';
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
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  const total = legend.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <aside className="legend" aria-label="Leyenda del mapa">
      <button
        type="button"
        className="legend__toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="legend__title">
          <Icon name="layers" />
          Leyenda
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
          <h2 className="legend__heading">Calles por estado</h2>
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

          <h2 className="legend__heading">Baches</h2>
          <ul className="legend__list">
            <li className="legend__item">
              <span className="legend__circle" aria-hidden="true" />
              <span className="legend__label">Confirmados</span>
              <span className="legend__count">{formatNumber(potholes.confirmed)}</span>
            </li>
            <li className="legend__item">
              <span className="legend__circle legend__circle--unconfirmed" aria-hidden="true" />
              <span className="legend__label">Sin confirmar (borde punteado)</span>
              <span className="legend__count">{formatNumber(potholes.unconfirmed)}</span>
            </li>
            <li className="legend__item">
              <span className="legend__circle legend__circle--repaired" aria-hidden="true" />
              <span className="legend__label">Reparados (atenuados)</span>
              <span className="legend__count">{formatNumber(potholes.repaired)}</span>
            </li>
          </ul>
          <p className="legend__note">El tamaño del círculo indica la severidad del bache.</p>
          <p className="legend__note">
            Solo los confirmados (vistos al menos dos veces) cambian el daño de las calles y las
            rutas.
          </p>

          {children}
        </div>
      )}
    </aside>
  );
}
