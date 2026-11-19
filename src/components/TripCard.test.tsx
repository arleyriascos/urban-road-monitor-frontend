import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageProvider';
import type { TripSummary, TripView } from '../types/trips';
import { TripCard } from './TripCard';

const TOKEN = 't'.repeat(43);

const SUMMARY: TripSummary = {
  id: 'trip-1',
  startedAt: '2026-11-16T13:30:00.000Z',
  endedAt: '2026-11-16T14:35:00.000Z',
  framesAnalyzed: 18432,
  distanceM: 1250.5,
  detectionCount: 3,
  platform: 'android',
  deviceLabel: 'Pixel 7',
  modelVersion: '1.0.0',
};

const DETAIL: TripView = {
  id: 'trip-1',
  startedAt: SUMMARY.startedAt,
  endedAt: SUMMARY.endedAt,
  framesAnalyzed: 18432,
  distanceM: 1250.5,
  detections: {
    total: 3,
    bySeverity: [
      { severity: 'leve', count: 1 },
      { severity: 'moderado', count: 2 },
      { severity: 'grave', count: 0 },
    ],
  },
};

function renderCard(trip: TripSummary = SUMMARY, getTrip = vi.fn(async () => DETAIL)) {
  render(
    <ul>
      <TripCard trip={trip} token={TOKEN} dependencies={{ getTrip }} />
    </ul>,
  );
  return getTrip;
}

beforeEach(() => window.localStorage.clear());

describe('TripCard', () => {
  it('shows when, how far, how long and how many potholes', () => {
    renderCard();

    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('16/11/2026');
    expect(screen.getByText('1,3 km')).toBeTruthy();
    expect(screen.getByText('1 h 5 min')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.queryByText('En curso')).toBeNull();
  });

  it('says "En curso" and shows no duration while the trip is open', () => {
    renderCard({ ...SUMMARY, endedAt: null });

    expect(screen.getByText('En curso')).toBeTruthy();
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('says "Ninguno" when it found no potholes', () => {
    renderCard({ ...SUMMARY, detectionCount: 0 });
    expect(screen.getByText('Ninguno')).toBeTruthy();
  });

  it('does not ask the server for the details until they are opened', () => {
    const getTrip = renderCard();
    expect(getTrip).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Ver detalle' }).getAttribute('aria-expanded')).toBe(
      'false',
    );
  });

  it('opens the details: images, phone, model and the potholes by severity', async () => {
    const getTrip = renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle' }));

    expect(screen.getByRole('status').textContent).toBe('Cargando el detalle…');
    await waitFor(() => expect(screen.getByText('Moderado')).toBeTruthy());
    expect(getTrip).toHaveBeenCalledWith(TOKEN, 'trip-1', expect.any(AbortSignal));
    expect(screen.getByText('18.432')).toBeTruthy();
    expect(screen.getByText('Pixel 7')).toBeTruthy();
    expect(screen.getByText('1.0.0')).toBeTruthy();
    const severities = screen.getByText('Baches por severidad').nextElementSibling as HTMLElement;
    expect(
      within(severities)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Leve1', 'Moderado2', 'Grave0']);
    expect(screen.getByRole('button', { name: 'Ocultar detalle' })).toBeTruthy();
  });

  it('closes the details again', async () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle' }));
    await screen.findByText('Baches por severidad');

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar detalle' }));

    expect(screen.queryByText('Baches por severidad')).toBeNull();
  });

  it('names the platform when the person gave no name to the phone', async () => {
    renderCard({ ...SUMMARY, deviceLabel: null, platform: 'ios' });
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle' }));

    expect(screen.getByText('iPhone')).toBeTruthy();
  });

  it('says it could not load the details when the server fails', async () => {
    renderCard(
      SUMMARY,
      vi.fn(async () => {
        throw new Error('503');
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle' }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      'No pudimos cargar el detalle de este viaje.',
    );
  });

  it('is written in English, with its date, number and distance', async () => {
    window.localStorage.setItem('urban-road-monitor.language', 'en');
    render(
      <LanguageProvider>
        <ul>
          <TripCard
            trip={SUMMARY}
            token={TOKEN}
            dependencies={{ getTrip: vi.fn(async () => DETAIL) }}
          />
        </ul>
      </LanguageProvider>,
    );

    expect(screen.getByText('Distance')).toBeTruthy();
    expect(screen.getByText('1.3 km')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show details' }));
    await screen.findByText('Potholes by severity');
    expect(screen.getByText('18,432')).toBeTruthy();
    expect(screen.getByText('Moderate')).toBeTruthy();
  });
});
