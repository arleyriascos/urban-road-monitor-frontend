import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MapData } from '../hooks/useMapData';
import { potholesFixture, segmentsFixture, statsFixture } from '../test/fixtures';
import type { PotholeCollection } from '../types/map';
import { MapScreen } from './MapScreen';

// Leaflet needs a real layout to work, so the map is replaced by a marker that
// shows what the screen gave it.
vi.mock('./MapView', () => ({
  MapView: (props: { potholes: PotholeCollection; showPotholes: boolean; recenterKey: number }) => (
    <div
      data-testid="map"
      data-potholes={props.potholes.features.length}
      data-show={String(props.showPotholes)}
      data-recenter={props.recenterKey}
    />
  ),
}));

const data: MapData = { segments: segmentsFixture, potholes: potholesFixture, stats: statsFixture };

const map = () => screen.getByTestId('map');

describe('MapScreen', () => {
  it('shows the top bar, the map and the legend', () => {
    render(<MapScreen data={data} />);
    expect(screen.getByText('4.610 vías · 774,1 km · 54 baches activos')).toBeTruthy();
    expect(map()).toBeTruthy();
    expect(screen.getByRole('complementary', { name: 'Leyenda del mapa' })).toBeTruthy();
  });

  it('shows the potholes except the repaired ones at first', () => {
    render(<MapScreen data={data} />);
    expect(map().dataset.show).toBe('true');
    expect(map().dataset.potholes).toBe('2');
  });

  it('includes the repaired potholes when asked', () => {
    render(<MapScreen data={data} />);
    fireEvent.click(screen.getByLabelText(/Incluir reparados/));
    expect(map().dataset.potholes).toBe('3');
  });

  it('hides the potholes with the switch', () => {
    render(<MapScreen data={data} />);
    fireEvent.click(screen.getByLabelText('Mostrar baches'));
    expect(map().dataset.show).toBe('false');
  });

  it('asks the map to go back to the center with the recenter button', () => {
    render(<MapScreen data={data} />);
    expect(map().dataset.recenter).toBe('0');
    fireEvent.click(screen.getByRole('button', { name: /Centrar el mapa/ }));
    expect(map().dataset.recenter).toBe('1');
  });
});
