import type { PerformanceReading } from '../detection/meters';
import { formatDuration } from '../lib/duration';
import { formatDecimal } from '../lib/format';

interface PerformanceMeterProps {
  reading: PerformanceReading | null;
  /** How long the model took to download and to start, once it is ready. */
  load: { downloadMs: number; startMs: number } | null;
}

const WAITING = 'Midiendo…';

/** Meter 1: how fast this phone runs the detection. */
export function PerformanceMeter({ reading, load }: PerformanceMeterProps) {
  return (
    <section className="meter" aria-labelledby="performance-meter-title">
      <h2 id="performance-meter-title" className="meter__title">
        Rendimiento
      </h2>
      <dl className="meter__list">
        <div className="meter__row">
          <dt>Detecciones por segundo</dt>
          <dd>{reading?.fps != null ? formatDecimal(reading.fps, 1) : WAITING}</dd>
        </div>
        <div className="meter__row">
          <dt>Tiempo del modelo</dt>
          <dd>{reading?.inferenceMs != null ? formatDuration(reading.inferenceMs) : WAITING}</dd>
        </div>
        <div className="meter__row">
          <dt>Tiempo total por cuadro</dt>
          <dd>{reading?.totalMs != null ? formatDuration(reading.totalMs) : WAITING}</dd>
        </div>
        <div className="meter__row">
          <dt>Carga del modelo</dt>
          <dd>
            {load
              ? `${formatDuration(load.downloadMs)} + ${formatDuration(load.startMs)}`
              : WAITING}
          </dd>
        </div>
      </dl>
    </section>
  );
}
