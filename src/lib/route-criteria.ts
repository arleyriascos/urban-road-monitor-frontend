import type { RouteCriterion } from '../types/route';

/** The three ways to choose a route, in the order the panel shows them. */
export const CRITERIA: { value: RouteCriterion; label: string; hint: string }[] = [
  { value: 'shortest', label: 'Más corta', hint: 'La distancia más corta, sin mirar los baches.' },
  {
    value: 'balanced',
    label: 'Equilibrada',
    hint: 'Equilibra la distancia y el estado de las calles.',
  },
  {
    value: 'avoid_potholes',
    label: 'Evitar baches',
    hint: 'Evita las calles con baches, aunque el camino sea más largo.',
  },
];
