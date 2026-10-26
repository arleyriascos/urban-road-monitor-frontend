import { describe, expect, it } from 'vitest';
import { potholesFixture } from '../test/fixtures';
import { filterPotholes } from './potholes';

describe('filterPotholes', () => {
  it('leaves repaired potholes out by default', () => {
    const result = filterPotholes(potholesFixture, { includeRepaired: false });
    expect(result.features.map((feature) => feature.id)).toEqual(['a1', 'a2']);
  });

  it('keeps every pothole when repaired ones are included', () => {
    const result = filterPotholes(potholesFixture, { includeRepaired: true });
    expect(result.features).toHaveLength(3);
  });

  it('keeps the shape of a GeoJSON collection', () => {
    expect(filterPotholes(potholesFixture, { includeRepaired: false }).type).toBe(
      'FeatureCollection',
    );
  });

  it('does not change the original collection', () => {
    filterPotholes(potholesFixture, { includeRepaired: false });
    expect(potholesFixture.features).toHaveLength(3);
  });
});
