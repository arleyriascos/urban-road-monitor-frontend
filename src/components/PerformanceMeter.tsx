import { useLanguage } from '../i18n/useLanguage';
import type { PerformanceReading } from '../detection/meters';
import { formatDuration } from '../lib/duration';
import { formatDecimal } from '../lib/format';

interface PerformanceMeterProps {
  reading: PerformanceReading | null;
  /** How long the model took to download and to start, once it is ready. */
  load: { downloadMs: number; startMs: number } | null;
}

/** Meter 1: how fast this phone runs the detection. */
export function PerformanceMeter({ reading, load }: PerformanceMeterProps) {
  const { t, locale } = useLanguage();
  const waiting = t('meter.measuring');
  return (
    <section className="meter" aria-labelledby="performance-meter-title">
      <h2 id="performance-meter-title" className="meter__title">
        {t('meter.performance.title')}
      </h2>
      <dl className="meter__list">
        <div className="meter__row">
          <dt>{t('meter.performance.fps')}</dt>
          <dd>{reading?.fps != null ? formatDecimal(reading.fps, 1, locale) : waiting}</dd>
        </div>
        <div className="meter__row">
          <dt>{t('meter.performance.model')}</dt>
          <dd>
            {reading?.inferenceMs != null ? formatDuration(reading.inferenceMs, locale) : waiting}
          </dd>
        </div>
        <div className="meter__row">
          <dt>{t('meter.performance.total')}</dt>
          <dd>{reading?.totalMs != null ? formatDuration(reading.totalMs, locale) : waiting}</dd>
        </div>
        <div className="meter__row">
          <dt>{t('meter.performance.load')}</dt>
          <dd>
            {load
              ? `${formatDuration(load.downloadMs, locale)} + ${formatDuration(load.startMs, locale)}`
              : waiting}
          </dd>
        </div>
      </dl>
    </section>
  );
}
