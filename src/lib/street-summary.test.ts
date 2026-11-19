import { describe, expect, it } from 'vitest';
import { englishTexts } from '../test/english';
import type { StretchSummary } from '../types/roads';
import { combineSummaries, describeStreetSummary } from './street-summary';

const summary = (patch: Partial<StretchSummary> = {}): StretchSummary => ({
  segments: 2,
  lengthM: 100,
  visiblePotholes: 0,
  confirmedPotholes: 0,
  damageScore: 0,
  worstSeverity: null,
  ...patch,
});

describe('combineSummaries', () => {
  it('adds up the numbers and keeps the worst severity', () => {
    const total = combineSummaries([
      summary({
        visiblePotholes: 1,
        confirmedPotholes: 1,
        damageScore: 2,
        worstSeverity: { name: 'moderado', weight: 3 },
      }),
      summary({
        segments: 3,
        lengthM: 50,
        visiblePotholes: 2,
        confirmedPotholes: 1,
        damageScore: 1.5,
        worstSeverity: { name: 'grave', weight: 6 },
      }),
      summary(),
    ]);
    expect(total).toEqual({
      segments: 7,
      lengthM: 250,
      visiblePotholes: 3,
      confirmedPotholes: 2,
      damageScore: 3.5,
      worstSeverity: { name: 'grave', weight: 6 },
    });
  });

  it('is empty for nothing', () => {
    expect(combineSummaries([])).toEqual(summary({ segments: 0, lengthM: 0 }));
  });
});

describe('describeStreetSummary', () => {
  it('says there is nothing when no pothole is in sight', () => {
    expect(describeStreetSummary(summary())).toBe('Sin baches a la vista');
  });

  it('says that potholes in sight are not confirmed yet', () => {
    expect(describeStreetSummary(summary({ visiblePotholes: 1 }))).toBe(
      '1 bache a la vista · ninguno confirmado',
    );
  });

  it('counts the confirmed ones and names the worst', () => {
    expect(
      describeStreetSummary(
        summary({
          visiblePotholes: 3,
          confirmedPotholes: 2,
          worstSeverity: { name: 'grave', weight: 6 },
        }),
      ),
    ).toBe('3 baches a la vista · 2 confirmados · peor: Grave');
  });

  it('writes one confirmed pothole in the singular', () => {
    expect(describeStreetSummary(summary({ visiblePotholes: 1, confirmedPotholes: 1 }))).toBe(
      '1 bache a la vista · 1 confirmado',
    );
  });
});

describe('describeStreetSummary in English', () => {
  it('describes the potholes of a part of the route in English', () => {
    expect(describeStreetSummary(summary(), englishTexts)).toBe('No potholes in sight');
    expect(
      describeStreetSummary(
        summary({
          visiblePotholes: 2,
          confirmedPotholes: 1,
          worstSeverity: { name: 'grave', weight: 6 },
        }),
        englishTexts,
      ),
    ).toBe('2 potholes in sight · 1 confirmed · worst: Severe');
    expect(describeStreetSummary(summary({ visiblePotholes: 1 }), englishTexts)).toBe(
      '1 pothole in sight · none confirmed',
    );
  });
});
