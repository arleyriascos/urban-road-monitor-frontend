import { useLanguage } from '../i18n/useLanguage';
import { Icon } from './Icon';

/** Brings the map back to the center of Pasto. */
export function RecenterButton({ onClick }: { onClick: () => void }) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      className="recenter"
      onClick={onClick}
      aria-label={t('map.recenter.label')}
    >
      <Icon name="locate" />
      <span className="recenter__text">{t('map.recenter.text')}</span>
    </button>
  );
}
