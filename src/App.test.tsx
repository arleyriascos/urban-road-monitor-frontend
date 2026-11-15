import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { wakeAiService } from './api/ai-service';

vi.mock('./api/ai-service', () => ({ wakeAiService: vi.fn() }));
vi.mock('./components/MapApp', () => ({ MapApp: () => <div data-testid="map-app" /> }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('App', () => {
  it('shows the app of the map', () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId('map-app')).toBeTruthy();
  });

  it('starts waking the AI service once, as soon as the app opens', () => {
    const { rerender } = render(<App />);
    rerender(<App />);

    expect(wakeAiService).toHaveBeenCalledOnce();
  });
});
