import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildSeverityLegend, countPotholes } from '../lib/legend';
import { statsFixture } from '../test/fixtures';
import { LegendPanel } from './LegendPanel';

const legend = buildSeverityLegend(statsFixture);
const potholes = countPotholes(statsFixture);

describe('LegendPanel', () => {
  it('lists the colors of the streets with their counts', () => {
    render(<LegendPanel legend={legend} potholes={potholes} />);
    expect(screen.getByText('Sin baches')).toBeTruthy();
    expect(screen.getByText('10.085')).toBeTruthy();
    expect(screen.getByText('Grave')).toBeTruthy();
  });

  it('lists the potholes by status', () => {
    render(<LegendPanel legend={legend} potholes={potholes} />);
    expect(screen.getByText('Confirmados').nextSibling?.textContent).toBe('45');
    expect(screen.getByText(/Sin confirmar/).nextSibling?.textContent).toBe('9');
    expect(screen.getByText(/Reparados/).nextSibling?.textContent).toBe('6');
  });

  it('folds and unfolds with its button', () => {
    render(<LegendPanel legend={legend} potholes={potholes} />);
    const button = screen.getByRole('button', { name: /Leyenda/ });
    expect(button.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Sin baches')).toBeNull();

    fireEvent.click(button);
    expect(screen.getByText('Sin baches')).toBeTruthy();
  });

  it('can start folded (phones)', () => {
    render(<LegendPanel legend={legend} potholes={potholes} defaultOpen={false} />);
    expect(screen.getByRole('button', { name: /Leyenda/ }).getAttribute('aria-expanded')).toBe(
      'false',
    );
    expect(screen.queryByText('Sin baches')).toBeNull();
  });

  it('shows its children inside the panel', () => {
    render(
      <LegendPanel legend={legend} potholes={potholes}>
        <p>Contenido extra</p>
      </LegendPanel>,
    );
    expect(screen.getByText('Contenido extra')).toBeTruthy();
  });
});
