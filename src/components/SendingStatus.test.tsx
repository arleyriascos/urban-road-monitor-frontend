import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderInEnglish } from '../test/english';
import { SendingStatus } from './SendingStatus';

describe('SendingStatus', () => {
  it('shows each message in a status region', () => {
    render(
      <SendingStatus
        summary={{
          messages: [
            { tone: 'info', text: 'Primero' },
            { tone: 'warning', text: 'Segundo' },
          ],
          counts: null,
        }}
      />,
    );
    const region = screen.getByRole('region', { name: 'Guardado de baches' });
    const items = within(region).getAllByRole('status');
    expect(items.map((item) => item.textContent)).toEqual(['Primero', 'Segundo']);
    expect(items[1].classList.contains('sending__message--warning')).toBe(true);
    expect(items[0].classList.contains('sending__message--warning')).toBe(false);
  });

  it('shows the counts only when there are some', () => {
    const { rerender } = render(<SendingStatus summary={{ messages: [], counts: null }} />);
    expect(screen.queryByText('Enviados')).toBeNull();

    rerender(<SendingStatus summary={{ messages: [], counts: { stored: 12, pending: 3 } }} />);
    expect(screen.getByText('Enviados').nextSibling?.textContent).toBe('12');
    expect(screen.getByText('En espera').nextSibling?.textContent).toBe('3');
  });
});

describe('SendingStatus in English', () => {
  it('names the counts in English', () => {
    renderInEnglish(
      <SendingStatus
        summary={{ messages: [{ tone: 'info', text: 'Hello' }], counts: { stored: 3, pending: 1 } }}
      />,
    );
    expect(screen.getByRole('region', { name: 'Saving potholes' })).toBeTruthy();
    expect(screen.getByText('Sent').nextElementSibling?.textContent).toBe('3');
    expect(screen.getByText('Waiting').nextElementSibling?.textContent).toBe('1');
  });
});
