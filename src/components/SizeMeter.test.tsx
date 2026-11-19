import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SizeSummary } from '../detection/meters';
import { renderInEnglish } from '../test/english';
import { SizeMeter } from './SizeMeter';

const EMPTY: SizeSummary = {
  boxes: [],
  counts: { leve: 0, moderado: 0, grave: 0 },
  averageRatio: null,
};

const TWO: SizeSummary = {
  boxes: [
    { ratio: 0.125, severity: 'grave', score: 0.91 },
    { ratio: 0.004, severity: 'leve', score: 0.55 },
  ],
  counts: { leve: 1, moderado: 0, grave: 1 },
  averageRatio: 0.0645,
};

describe('SizeMeter', () => {
  it('says there are no potholes when there is no reading or no boxes', () => {
    const { rerender } = render(<SizeMeter summary={null} />);
    expect(screen.getByText('Sin baches a la vista')).toBeTruthy();
    rerender(<SizeMeter summary={EMPTY} />);
    expect(screen.getByText('Sin baches a la vista')).toBeTruthy();
    expect(screen.queryByRole('list', { name: /Baches/ })).toBeNull();
  });

  it('counts the potholes in singular and plural', () => {
    const one: SizeSummary = {
      boxes: [TWO.boxes[0]],
      counts: { leve: 0, moderado: 0, grave: 1 },
      averageRatio: 0.125,
    };
    const { rerender } = render(<SizeMeter summary={one} />);
    expect(screen.getByText('1 bache a la vista')).toBeTruthy();
    rerender(<SizeMeter summary={TWO} />);
    expect(screen.getByText('2 baches a la vista')).toBeTruthy();
  });

  it('shows the number of each severity with the rule that gives it, in words', () => {
    render(<SizeMeter summary={TWO} />);
    const counts = screen.getAllByRole('listitem').slice(0, 3);
    expect(counts.map((item) => item.textContent)).toEqual([
      '1 grave4 % o más del cuadro',
      '0 moderadode 1 % a 4 % del cuadro',
      '1 levemenos de 1 % del cuadro',
    ]);
  });

  it('lists each box biggest first, with its severity written, its size and its confidence', () => {
    render(<SizeMeter summary={TWO} />);
    const list = screen.getByRole('list', { name: 'Baches, del más grande al más pequeño' });
    const items = within(list).getAllByRole('listitem');
    expect(items[0].textContent).toBe('grave13 % del cuadroseguridad 91 %');
    expect(items[1].textContent).toBe('leve0,4 % del cuadroseguridad 55 %');
  });

  it('is a labelled region', () => {
    render(<SizeMeter summary={null} />);
    expect(screen.getByRole('region', { name: 'Tamaño y gravedad' })).toBeTruthy();
  });
});

describe('SizeMeter in English', () => {
  it('writes the rules and the boxes in English', () => {
    renderInEnglish(<SizeMeter summary={TWO} />);
    expect(screen.getByRole('heading', { name: 'Size and severity' })).toBeTruthy();
    expect(screen.getByText('2 potholes in sight')).toBeTruthy();
    expect(screen.getAllByText('severe')).toHaveLength(2);
    expect(screen.getAllByText(/of the frame/).length).toBeGreaterThan(0);
    const boxes = screen.getByRole('list', { name: 'Potholes, from the biggest to the smallest' });
    expect(within(boxes).getByText('13 % of the frame')).toBeTruthy();
    expect(within(boxes).getByText('confidence 91 %')).toBeTruthy();
  });

  it('says there are no potholes in English', () => {
    renderInEnglish(<SizeMeter summary={null} />);
    expect(screen.getByText('No potholes in sight')).toBeTruthy();
  });
});
