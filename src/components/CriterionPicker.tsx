import { useId } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { CRITERIA } from '../lib/route-criteria';
import type { RouteCriterion } from '../types/route';

interface CriterionPickerProps {
  value: RouteCriterion;
  onChange: (value: RouteCriterion) => void;
}

/** The three ways to choose a route. Changing it asks for the route again. */
export function CriterionPicker({ value, onChange }: CriterionPickerProps) {
  const { t } = useLanguage();
  const labelId = useId();
  const selected = CRITERIA.find((criterion) => criterion.value === value);

  return (
    <div className="criteria">
      <p id={labelId} className="criteria__label">
        {t('route.criterion.label')}
      </p>
      <div className="criteria__options" role="group" aria-labelledby={labelId}>
        {CRITERIA.map((criterion) => (
          <button
            key={criterion.value}
            type="button"
            className="criteria__option"
            aria-pressed={criterion.value === value}
            onClick={() => onChange(criterion.value)}
          >
            {t(criterion.labelKey)}
          </button>
        ))}
      </div>
      <p className="criteria__hint">{selected ? t(selected.hintKey) : null}</p>
    </div>
  );
}
