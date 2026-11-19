import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderInEnglish } from '../test/english';
import { PerformanceMeter } from './PerformanceMeter';

function value(label: string): string {
  const row = screen.getByText(label).closest('div') as HTMLElement;
  return within(row).getAllByText(/./).at(-1)?.textContent ?? '';
}

describe('PerformanceMeter', () => {
  it('says it is measuring while there are no numbers', () => {
    render(<PerformanceMeter reading={null} load={null} />);
    expect(value('Detecciones por segundo')).toBe('Midiendo…');
    expect(value('Carga del modelo')).toBe('Midiendo…');
  });

  it('shows the rate, the times and the load of the model', () => {
    render(
      <PerformanceMeter
        reading={{ fps: 2.94, inferenceMs: 180, totalMs: 1250 }}
        load={{ downloadMs: 2400, startMs: 600 }}
      />,
    );
    expect(value('Detecciones por segundo')).toBe('2,9');
    expect(value('Tiempo del modelo')).toBe('180 ms');
    expect(value('Tiempo total por cuadro')).toBe('1,3 s');
    expect(value('Carga del modelo')).toBe('2,4 s + 600 ms');
  });

  it('is a labelled region', () => {
    render(<PerformanceMeter reading={null} load={null} />);
    expect(screen.getByRole('region', { name: 'Rendimiento' })).toBeTruthy();
  });
});

describe('PerformanceMeter in English', () => {
  it('writes the labels and the numbers in English', () => {
    renderInEnglish(
      <PerformanceMeter
        reading={{ fps: 2.94, inferenceMs: 180, totalMs: 1250 }}
        load={{ downloadMs: 2400, startMs: 600 }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Performance' })).toBeTruthy();
    expect(value('Detections per second')).toBe('2.9');
    expect(value('Total time per frame')).toBe('1.3 s');
    expect(value('Model loading')).toBe('2.4 s + 600 ms');
  });

  it('says it is measuring while there are no numbers', () => {
    renderInEnglish(<PerformanceMeter reading={null} load={null} />);
    expect(value('Model time')).toBe('Measuring…');
  });
});
