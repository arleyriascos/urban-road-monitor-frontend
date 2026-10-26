import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LayerToggles } from './LayerToggles';

function renderToggles(overrides: Partial<Parameters<typeof LayerToggles>[0]> = {}) {
  const props = {
    showPotholes: true,
    includeRepaired: false,
    repairedCount: 6,
    onShowPotholesChange: vi.fn(),
    onIncludeRepairedChange: vi.fn(),
    ...overrides,
  };
  render(<LayerToggles {...props} />);
  return props;
}

describe('LayerToggles', () => {
  it('reflects the current state in the two checkboxes', () => {
    renderToggles({ includeRepaired: true });
    expect((screen.getByLabelText('Mostrar baches') as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText(/Incluir reparados/) as HTMLInputElement).checked).toBe(true);
  });

  it('shows how many repaired potholes there are', () => {
    renderToggles({ repairedCount: 6 });
    expect(screen.getByLabelText('Incluir reparados (6)')).toBeTruthy();
  });

  it('reports the new value when "Mostrar baches" changes', () => {
    const props = renderToggles();
    fireEvent.click(screen.getByLabelText('Mostrar baches'));
    expect(props.onShowPotholesChange).toHaveBeenCalledWith(false);
  });

  it('reports the new value when "Incluir reparados" changes', () => {
    const props = renderToggles();
    fireEvent.click(screen.getByLabelText(/Incluir reparados/));
    expect(props.onIncludeRepairedChange).toHaveBeenCalledWith(true);
  });

  it('cannot include repaired potholes while the potholes are hidden', () => {
    renderToggles({ showPotholes: false });
    expect((screen.getByLabelText(/Incluir reparados/) as HTMLInputElement).disabled).toBe(true);
  });
});
