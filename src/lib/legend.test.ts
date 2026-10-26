import { describe, expect, it } from 'vitest';
import { statsFixture } from '../test/fixtures';
import type { NetworkStats } from '../types/map';
import { buildSeverityLegend, countPotholes, summarizeNetwork } from './legend';

describe('buildSeverityLegend', () => {
  const legend = buildSeverityLegend(statsFixture);

  it('has one row per severity, from "sin baches" to the worst', () => {
    expect(legend.map((entry) => entry.label)).toEqual(['Sin baches', 'Leve', 'Moderado', 'Grave']);
  });

  it('keeps the colors of the API and formats the counts', () => {
    expect(legend[0]).toMatchObject({ color: '#22C55E', count: 10085, countLabel: '10.085' });
    expect(legend[3]).toMatchObject({ color: '#DC2626', count: 15, countLabel: '15' });
  });

  it('adds up to the number of segments', () => {
    expect(legend.reduce((sum, entry) => sum + entry.count, 0)).toBe(statsFixture.segments);
  });
});

describe('countPotholes', () => {
  it('counts active potholes as unconfirmed plus confirmed', () => {
    expect(countPotholes(statsFixture)).toEqual({
      active: 54,
      unconfirmed: 9,
      confirmed: 45,
      repaired: 6,
    });
  });

  it('uses 0 for a status that is missing', () => {
    expect(countPotholes({ ...statsFixture, potholesByStatus: [] })).toEqual({
      active: 0,
      unconfirmed: 0,
      confirmed: 0,
      repaired: 0,
    });
  });
});

describe('summarizeNetwork', () => {
  it('writes the numbers of the top bar in Spanish', () => {
    expect(summarizeNetwork(statsFixture)).toEqual({
      roads: '4.610 vías',
      length: '774,1 km',
      potholes: '54 baches activos',
    });
  });

  it('uses the singular for exactly one', () => {
    const single: NetworkStats = {
      ...statsFixture,
      roads: 1,
      potholesByStatus: [{ status: 'confirmado', count: 1 }],
    };
    expect(summarizeNetwork(single)).toMatchObject({
      roads: '1 vía',
      potholes: '1 bache activo',
    });
  });
});
