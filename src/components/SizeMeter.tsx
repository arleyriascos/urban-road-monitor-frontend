import { SEVERITY_LIMITS } from '../detection/severity';
import type { SizeSummary } from '../detection/meters';
import { formatCoverage } from '../lib/coverage';
import { formatPercent, pluralize } from '../lib/format';
import type { PotholeSeverity } from '../types/map';

interface SizeMeterProps {
  summary: SizeSummary | null;
}

const SEVERITIES: PotholeSeverity[] = ['grave', 'moderado', 'leve'];

function rule(severity: PotholeSeverity): string {
  const leve = formatPercent(SEVERITY_LIMITS.leve);
  const moderado = formatPercent(SEVERITY_LIMITS.moderado);
  if (severity === 'leve') return `menos de ${leve} del cuadro`;
  if (severity === 'moderado') return `de ${leve} a ${moderado} del cuadro`;
  return `${moderado} o más del cuadro`;
}

/** Meter 2: the size of each box and the severity it gets from it. */
export function SizeMeter({ summary }: SizeMeterProps) {
  const total = summary?.boxes.length ?? 0;

  return (
    <section className="meter" aria-labelledby="size-meter-title">
      <h2 id="size-meter-title" className="meter__title">
        Tamaño y gravedad
      </h2>

      <p className="meter__headline" aria-live="polite">
        {total === 0
          ? 'Sin baches a la vista'
          : `${pluralize(total, 'bache', 'baches')} a la vista`}
      </p>

      <ul className="meter__counts">
        {SEVERITIES.map((severity) => (
          <li key={severity} className={`meter__count meter__count--${severity}`}>
            <span className="meter__count-number">{summary?.counts[severity] ?? 0}</span>{' '}
            <span className="meter__count-label">{severity}</span>
            <span className="meter__count-rule">{rule(severity)}</span>
          </li>
        ))}
      </ul>

      {summary && summary.boxes.length > 0 && (
        <ol className="meter__boxes" aria-label="Baches, del más grande al más pequeño">
          {summary.boxes.map((box, index) => (
            <li key={index} className={`meter__box meter__box--${box.severity}`}>
              <span className="meter__box-severity">{box.severity}</span>
              <span>{formatCoverage(box.ratio)} del cuadro</span>
              <span>seguridad {formatPercent(box.score)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
