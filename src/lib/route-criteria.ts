import type { MessageKey } from '../i18n/translate';
import type { RouteCriterion } from '../types/route';

/** The three ways to choose a route, in the order the panel shows them. */
export const CRITERIA: { value: RouteCriterion; labelKey: MessageKey; hintKey: MessageKey }[] = [
  {
    value: 'shortest',
    labelKey: 'route.criterion.shortest.label',
    hintKey: 'route.criterion.shortest.hint',
  },
  {
    value: 'balanced',
    labelKey: 'route.criterion.balanced.label',
    hintKey: 'route.criterion.balanced.hint',
  },
  {
    value: 'avoid_potholes',
    labelKey: 'route.criterion.avoid.label',
    hintKey: 'route.criterion.avoid.hint',
  },
];
