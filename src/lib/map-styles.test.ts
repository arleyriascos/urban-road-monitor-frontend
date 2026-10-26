import { describe, expect, it } from 'vitest';
import { potholesFixture, segmentsFixture } from '../test/fixtures';
import { potholeMarkerStyle, segmentStyle, sortBySeverity } from './map-styles';

const [clean, severe, mild] = segmentsFixture.features;
const [confirmed, unconfirmed, repaired] = potholesFixture.features.map(
  (feature) => feature.properties,
);

describe('segmentStyle', () => {
  it('uses the color of the API and a thicker line for worse streets', () => {
    expect(segmentStyle(clean.properties)).toMatchObject({ color: '#22C55E', weight: 3 });
    expect(segmentStyle(mild.properties)).toMatchObject({ color: '#FACC15', weight: 4 });
    expect(segmentStyle(severe.properties)).toMatchObject({ color: '#DC2626', weight: 6 });
  });

  it('draws streets without potholes a little lighter', () => {
    const clearOpacity = segmentStyle(clean.properties).opacity ?? 1;
    const severeOpacity = segmentStyle(severe.properties).opacity ?? 1;
    expect(clearOpacity).toBeLessThan(severeOpacity);
  });

  it('replaces an unsafe color with a neutral one', () => {
    expect(segmentStyle({ ...clean.properties, color: 'red' }).color).toBe('#9ca3af');
  });
});

describe('sortBySeverity', () => {
  it('puts the worst streets last, so they are drawn on top', () => {
    const sorted = sortBySeverity([severe, clean, mild]);
    expect(sorted.map((feature) => feature.properties.severity)).toEqual([
      'sin baches',
      'leve',
      'grave',
    ]);
  });

  it('keeps the original order between streets of the same severity', () => {
    const second = { ...clean, id: 99 };
    expect(sortBySeverity([second, clean]).map((feature) => feature.id)).toEqual([99, 1]);
  });

  it('does not change the list it receives', () => {
    const original = [severe, clean];
    sortBySeverity(original);
    expect(original[0]).toBe(severe);
  });
});

describe('potholeMarkerStyle', () => {
  it('uses a bigger circle for worse potholes', () => {
    const radius = (severity: 'leve' | 'moderado' | 'grave') =>
      potholeMarkerStyle({ ...confirmed, severity }).radius ?? 0;
    expect(radius('leve')).toBeLessThan(radius('moderado'));
    expect(radius('moderado')).toBeLessThan(radius('grave'));
  });

  it('fills the circle with the color of the pothole', () => {
    expect(potholeMarkerStyle(confirmed).fillColor).toBe('#DC2626');
  });

  it('marks unconfirmed potholes with a dashed border', () => {
    expect(potholeMarkerStyle(unconfirmed).dashArray).toBe('3 3');
    expect(potholeMarkerStyle(confirmed).dashArray).toBeUndefined();
  });

  it('fades repaired potholes', () => {
    const repairedOpacity = potholeMarkerStyle(repaired).fillOpacity ?? 1;
    const activeOpacity = potholeMarkerStyle(confirmed).fillOpacity ?? 0;
    expect(repairedOpacity).toBeLessThan(activeOpacity);
  });
});
