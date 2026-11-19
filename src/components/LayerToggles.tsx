import { useLanguage } from '../i18n/useLanguage';

interface LayerTogglesProps {
  showPotholes: boolean;
  includeRepaired: boolean;
  repairedCount: number;
  onShowPotholesChange: (value: boolean) => void;
  onIncludeRepairedChange: (value: boolean) => void;
}

/** Switches to show or hide the potholes and to include the repaired ones. */
export function LayerToggles({
  showPotholes,
  includeRepaired,
  repairedCount,
  onShowPotholesChange,
  onIncludeRepairedChange,
}: LayerTogglesProps) {
  const { t } = useLanguage();
  return (
    <fieldset className="toggles">
      <legend className="toggles__legend">{t('layers.legend')}</legend>
      <label className="toggle">
        <input
          type="checkbox"
          checked={showPotholes}
          onChange={(event) => onShowPotholesChange(event.target.checked)}
        />
        <span>{t('layers.showPotholes')}</span>
      </label>
      <label className="toggle">
        <input
          type="checkbox"
          checked={includeRepaired}
          disabled={!showPotholes}
          onChange={(event) => onIncludeRepairedChange(event.target.checked)}
        />
        <span>{t('layers.includeRepaired', { count: repairedCount })}</span>
      </label>
    </fieldset>
  );
}
