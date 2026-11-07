import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { groupRouteSteps } from '../lib/route-groups';
import { routeFixture } from '../test/route-fixtures';
import { RouteSteps } from './RouteSteps';

const groups = groupRouteSteps(routeFixture);

function renderSteps(selected: number | null = null) {
  const onSelect = vi.fn();
  render(<RouteSteps groups={groups} selected={selected} onSelect={onSelect} />);
  return onSelect;
}

const previous = () => screen.getByRole('button', { name: 'Anterior' }) as HTMLButtonElement;
const next = () => screen.getByRole('button', { name: 'Siguiente' }) as HTMLButtonElement;

describe('RouteSteps', () => {
  it('lists the streets in travel order with their length and segments', () => {
    renderSteps();

    const items = screen
      .getAllByRole('listitem')
      .filter((item) => item.className.includes('entry'));
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain('Calle 18');
    expect(items[0].textContent).toContain('224 m · 2 tramos · 1 con daño');
    expect(items[1].textContent).toContain('Calle sin nombre');
    expect(items[1].textContent).toContain('113 m · 1 tramo');
  });

  it('shows nothing for a route without streets', () => {
    const { container } = render(<RouteSteps groups={[]} selected={null} onSelect={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('starts with nothing picked: Siguiente goes to the first street and Anterior is off', () => {
    const onSelect = renderSteps(null);

    expect(screen.getByText('Recorre la ruta')).toBeTruthy();
    expect(previous().disabled).toBe(true);
    fireEvent.click(next());

    expect(onSelect).toHaveBeenCalledWith(0);
    expect(screen.queryByRole('button', { name: 'Ver toda la ruta' })).toBeNull();
  });

  it('says which street it is on and marks it as the current step', () => {
    renderSteps(1);

    expect(screen.getByText('Calle 2 de 2')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /Calle sin nombre/ }).getAttribute('aria-current'),
    ).toBe('step');
    expect(
      screen.getByRole('button', { name: /Calle 18/ }).getAttribute('aria-current'),
    ).toBeNull();
  });

  it('goes to the previous and the next street with the buttons', () => {
    const onSelect = renderSteps(0);

    fireEvent.click(next());
    expect(onSelect).toHaveBeenLastCalledWith(1);
  });

  it('turns Anterior and Siguiente off at the two ends', () => {
    renderSteps(0);
    expect(previous().disabled).toBe(true);
    expect(next().disabled).toBe(false);
  });

  it('turns Siguiente off on the last street, and Anterior goes back', () => {
    const onSelect = renderSteps(1);

    expect(next().disabled).toBe(true);
    fireEvent.click(previous());
    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it('opens the street picked to show its segments one by one', () => {
    renderSteps(0);

    const segments = screen.getByRole('list', { name: 'Tramos de Calle 18' });
    const items = within(segments).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Tramo 1 · 111 m · Sin daño',
      'Tramo 2 · 112 m · Daño 2,0',
    ]);
  });

  it('shows the segments of only the street picked', () => {
    renderSteps(0);
    expect(screen.queryByRole('list', { name: 'Tramos de Calle sin nombre' })).toBeNull();
  });

  it('picks a street by clicking it', () => {
    const onSelect = renderSteps();
    fireEvent.click(screen.getByRole('button', { name: /Calle sin nombre/ }));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('goes back to the whole route', () => {
    const onSelect = renderSteps(0);
    fireEvent.click(screen.getByRole('button', { name: 'Ver toda la ruta' }));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  describe('keyboard', () => {
    const section = () => screen.getByRole('region', { name: 'Recorrido de la ruta' });

    it.each(['ArrowDown', 'ArrowRight'])('%s goes to the next street', (key) => {
      const onSelect = renderSteps(0);
      fireEvent.keyDown(section(), { key });
      expect(onSelect).toHaveBeenCalledWith(1);
    });

    it.each(['ArrowUp', 'ArrowLeft'])('%s goes to the previous street', (key) => {
      const onSelect = renderSteps(1);
      fireEvent.keyDown(section(), { key });
      expect(onSelect).toHaveBeenCalledWith(0);
    });

    it('does not go past the first or the last street', () => {
      const first = renderSteps(0);
      fireEvent.keyDown(section(), { key: 'ArrowUp' });
      expect(first).toHaveBeenCalledWith(0);
    });

    it('starts at the first street from nothing', () => {
      const onSelect = renderSteps(null);
      fireEvent.keyDown(section(), { key: 'ArrowDown' });
      expect(onSelect).toHaveBeenCalledWith(0);
    });

    it('Escape goes back to the whole route, only when a street is picked', () => {
      const onSelect = renderSteps(1);
      fireEvent.keyDown(section(), { key: 'Escape' });
      expect(onSelect).toHaveBeenCalledWith(null);
    });

    it('Escape does nothing when no street is picked', () => {
      const onSelect = renderSteps(null);
      fireEvent.keyDown(section(), { key: 'Escape' });
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('ignores other keys', () => {
      const onSelect = renderSteps(0);
      fireEvent.keyDown(section(), { key: 'a' });
      expect(onSelect).not.toHaveBeenCalled();
    });
  });
});
