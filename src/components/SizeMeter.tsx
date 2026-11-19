import { useLanguage } from '../i18n/useLanguage';
import { SEVERITY_LIMITS } from '../detection/severity';
import type { SizeSummary } from '../detection/meters';
import { formatCoverage } from '../lib/coverage';
import { formatNumber, formatPercent, pluralize } from '../lib/format';
import { severityLabel } from '../lib/labels';
import type { Texts } from '../lib/translator';
import type { PotholeSeverity } from '../types/map';

interface SizeMeterProps {
  summary: SizeSummary | null;
}

const SEVERITIES: PotholeSeverity[] = ['grave', 'moderado', 'leve'];

function rule(severity: PotholeSeverity, { t, locale }: Texts): string {
  const leve = formatPercent(SEVERITY_LIMITS.leve, locale);
  const moderado = formatPercent(SEVERITY_LIMITS.moderado, locale);
  if (severity === 'leve') return t('meter.size.rule.leve', { limit: leve });
  if (severity === 'moderado') return t('meter.size.rule.moderado', { from: leve, to: moderado });
  return t('meter.size.rule.grave', { limit: moderado });
}

/** Meter 2: the size of each box and the severity it gets from it. */
export function SizeMeter({ summary }: SizeMeterProps) {
  const language = useLanguage();
  const { t, locale } = language;
  const total = summary?.boxes.length ?? 0;

  return (
    <section className="meter" aria-labelledby="size-meter-title">
      <h2 id="size-meter-title" className="meter__title">
        {t('meter.size.title')}
      </h2>

      <p className="meter__headline" aria-live="polite">
        {total === 0
          ? t('streetSummary.none')
          : pluralize(total, t('streetSummary.seen.one'), t('streetSummary.seen.other'), locale)}
      </p>

      <ul className="meter__counts">
        {SEVERITIES.map((severity) => (
          <li key={severity} className={`meter__count meter__count--${severity}`}>
            <span className="meter__count-number">
              {formatNumber(summary?.counts[severity] ?? 0, locale)}
            </span>{' '}
            <span className="meter__count-label">
              {severityLabel(severity, language).toLowerCase()}
            </span>
            <span className="meter__count-rule">{rule(severity, language)}</span>
          </li>
        ))}
      </ul>

      {summary && summary.boxes.length > 0 && (
        <ol className="meter__boxes" aria-label={t('meter.size.boxes')}>
          {summary.boxes.map((box, index) => (
            <li key={index} className={`meter__box meter__box--${box.severity}`}>
              <span className="meter__box-severity">
                {severityLabel(box.severity, language).toLowerCase()}
              </span>
              <span>{t('meter.size.coverage', { value: formatCoverage(box.ratio, locale) })}</span>
              <span>{t('meter.size.score', { value: formatPercent(box.score, locale) })}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
