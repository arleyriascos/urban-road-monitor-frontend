import type { PotholeCollection } from '../types/map';

/** Keeps the potholes the person wants to see. The API sends them all in one request. */
export function filterPotholes(
  collection: PotholeCollection,
  options: { includeRepaired: boolean },
): PotholeCollection {
  if (options.includeRepaired) return collection;
  return {
    ...collection,
    features: collection.features.filter((feature) => feature.properties.status !== 'reparado'),
  };
}
