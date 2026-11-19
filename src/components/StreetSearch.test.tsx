import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import type { StreetSearchDependencies } from '../hooks/useStreetSearch';
import type { StreetMatch } from '../types/roads';
import { renderInEnglish } from '../test/english';
import { StreetSearch } from './StreetSearch';

const street = (name: string, roadIds = [1], segments = 3): StreetMatch => ({
  name,
  roadIds,
  segments,
  center: { latitude: 1.2, longitude: -77.3 },
  bounds: { minLatitude: 1.2, maxLatitude: 1.21, minLongitude: -77.3, maxLongitude: -77.29 },
});

type Search = StreetSearchDependencies['search'];

function setup(search: Search) {
  const onSelect = vi.fn();
  const onClear = vi.fn();
  render(
    <StreetSearch
      onSelect={onSelect}
      onClear={onClear}
      dependencies={{ search, debounceMs: 300 }}
    />,
  );
  const input = screen.getByRole('combobox', { name: 'Buscar una calle' });
  return { onSelect, onClear, input };
}

async function typeAndWait(input: HTMLElement, text: string) {
  fireEvent.change(input, { target: { value: text } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const found: Search = async (q) => ({
  query: q,
  streets: [street('Calle 18', [7, 12], 24), street('Carrera 24', [3], 10)],
});

describe('StreetSearch', () => {
  it('starts with an empty box and no list', () => {
    const { input } = setup(found);
    expect((input as HTMLInputElement).value).toBe('');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Borrar búsqueda' })).toBeNull();
  });

  it('suggests streets while the person types, with how many segments each has', async () => {
    const { input } = setup(found);
    await typeAndWait(input, 'ca');

    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'Calle 1824 tramos',
      'Carrera 2410 tramos',
    ]);
    expect(input.getAttribute('aria-expanded')).toBe('true');
  });

  it('says it is searching while it waits', () => {
    const { input } = setup(() => new Promise(() => undefined));
    fireEvent.change(input, { target: { value: 'ca' } });
    expect(screen.getByRole('status').textContent).toBe('Buscando…');
  });

  it('picks a street with a click: fills the box, closes the list and tells the map', async () => {
    const { input, onSelect } = setup(found);
    await typeAndWait(input, 'ca');

    fireEvent.click(screen.getByRole('option', { name: /Calle 18/ }));

    expect(onSelect).toHaveBeenCalledWith(street('Calle 18', [7, 12], 24));
    expect((input as HTMLInputElement).value).toBe('Calle 18');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('moves with the arrows, picks with Enter and wraps around', async () => {
    const { input, onSelect } = setup(found);
    await typeAndWait(input, 'ca');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.getAttribute('aria-activedescendant')).toMatch(/-0$/);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.getAttribute('aria-activedescendant')).toMatch(/-0$/);
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.getAttribute('aria-activedescendant')).toMatch(/-1$/);
    expect(screen.getAllByRole('option')[1].getAttribute('aria-selected')).toBe('true');

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(street('Carrera 24', [3], 10));
  });

  it('does not pick anything with Enter when no suggestion is active', async () => {
    const { input, onSelect } = setup(found);
    await typeAndWait(input, 'ca');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('closes the list with Escape, and clears the box with a second Escape', async () => {
    const { input, onClear } = setup(found);
    await typeAndWait(input, 'ca');

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect((input as HTMLInputElement).value).toBe('ca');

    fireEvent.keyDown(input, { key: 'Escape' });
    expect((input as HTMLInputElement).value).toBe('');
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('clears the box with its button and tells the map to let the street go', async () => {
    const { input, onClear } = setup(found);
    await typeAndWait(input, 'ca');

    fireEvent.click(screen.getByRole('button', { name: 'Borrar búsqueda' }));

    expect((input as HTMLInputElement).value).toBe('');
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('says when no street has that name', async () => {
    const { input } = setup(async (q) => ({ query: q, streets: [] }));
    await typeAndWait(input, 'zz');
    expect(screen.getByRole('status').textContent).toBe('No hay calles con ese nombre.');
  });

  it('explains a failure and tries again with the button', async () => {
    const search = vi
      .fn<Search>()
      .mockRejectedValueOnce(new ApiError('network', 'down'))
      .mockImplementation(found);
    const { input } = setup(search);
    await typeAndWait(input, 'ca');

    expect(screen.getByRole('alert').textContent).toMatch(/Sin conexión/);

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it('shows nothing for a single letter', async () => {
    const search = vi.fn<Search>(found);
    const { input } = setup(search);
    await typeAndWait(input, 'c');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(search).not.toHaveBeenCalled();
  });

  it('opens the list again when the person edits the picked name', async () => {
    const { input } = setup(found);
    await typeAndWait(input, 'ca');
    fireEvent.click(screen.getAllByRole('option')[0]);
    await typeAndWait(input, 'Calle 1');
    expect(screen.getByRole('listbox')).toBeTruthy();
  });
});

describe('StreetSearch in English', () => {
  it('writes the box and the answers in English', async () => {
    const search = vi.fn<Search>(async (q) => ({
      query: q,
      streets: [street('Calle 18', [1], 1)],
    }));
    renderInEnglish(
      <StreetSearch
        onSelect={vi.fn()}
        onClear={vi.fn()}
        dependencies={{ search, debounceMs: 300 }}
      />,
    );
    const input = screen.getByRole('combobox', { name: 'Search for a street' });
    await typeAndWait(input, 'calle');
    const list = screen.getByRole('listbox', { name: 'Streets found' });
    expect(within(list).getByText('1 segment')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeTruthy();
  });

  it('says in English when no street has that name', async () => {
    const search = vi.fn<Search>(async (q) => ({ query: q, streets: [] }));
    renderInEnglish(
      <StreetSearch
        onSelect={vi.fn()}
        onClear={vi.fn()}
        dependencies={{ search, debounceMs: 300 }}
      />,
    );
    await typeAndWait(screen.getByRole('combobox'), 'zzz');
    expect(screen.getByText('No streets have that name.')).toBeTruthy();
  });

  it('offers to retry in English when the search fails', async () => {
    const search = vi.fn<Search>().mockRejectedValue(new ApiError('network', 'down'));
    renderInEnglish(
      <StreetSearch
        onSelect={vi.fn()}
        onClear={vi.fn()}
        dependencies={{ search, debounceMs: 300 }}
      />,
    );
    await typeAndWait(screen.getByRole('combobox'), 'calle');
    expect(screen.getByText('No connection. Check your internet and try again.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });
});
