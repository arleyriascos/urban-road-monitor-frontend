import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { ApiError } from './api/http';
import { useMapData, type MapDataState } from './hooks/useMapData';
import { potholesFixture, segmentsFixture, statsFixture } from './test/fixtures';

vi.mock('./hooks/useMapData');
vi.mock('./components/MapScreen', () => ({
  MapScreen: () => <div data-testid="map-screen" />,
}));

const retry = vi.fn();

function showState(state: MapDataState) {
  vi.mocked(useMapData).mockReturnValue({ state, retry });
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('App', () => {
  it('shows the loading screen while the data loads', () => {
    showState({ status: 'loading', slow: false });
    render(<App />);
    expect(screen.getByText('Cargando el mapa…')).toBeTruthy();
    expect(screen.queryByTestId('map-screen')).toBeNull();
  });

  it('explains the sleeping server when the request is slow', () => {
    showState({ status: 'loading', slow: true });
    render(<App />);
    expect(screen.getByText(/despertando/)).toBeTruthy();
  });

  it('shows the error screen and retries from its button', () => {
    showState({ status: 'error', error: new ApiError('network', 'x') });
    render(<App />);
    expect(screen.getByRole('alert')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('shows the map when the data is ready', () => {
    showState({
      status: 'success',
      data: { segments: segmentsFixture, potholes: potholesFixture, stats: statsFixture },
      receivedAt: new Date(),
    });
    render(<App />);
    expect(screen.getByTestId('map-screen')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
