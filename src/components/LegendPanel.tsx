import { useId, useState, type ReactNode } from 'react';
import { formatNumber } from '../lib/format';
import type { LegendEntry, PotholeCounts } from '../lib/legend';

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

  return (
    <aside className="legend" aria-label="Leyenda del mapa">
      <button
        type="button"
        className="legend__toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>Leyenda</span>
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div id={bodyId} className="legend__body">
          <h2 className="legend__heading">Calles por estado</h2>
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
              <span className="legend__label">Confirmados</span>
              <span className="legend__count">{formatNumber(potholes.confirmed)}</span>
            </li>
            <li className="legend__item">
              <span className="legend__label">Sin confirmar (borde punteado)</span>
              <span className="legend__count">{formatNumber(potholes.unconfirmed)}</span>
            </li>
            <li className="legend__item">
              <span className="legend__label">Reparados (atenuados)</span>
              <span className="legend__count">{formatNumber(potholes.repaired)}</span>
            </li>
          </ul>
          <p className="legend__note">El tamaño del círculo indica la severidad del bache.</p>

          {children}
        </div>
      )}
    </aside>
  );
}
