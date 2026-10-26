import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import { ErrorScreen } from './ErrorScreen';

describe('ErrorScreen', () => {
  it('explains what happened and is announced as an alert', () => {
    render(<ErrorScreen error={new ApiError('network', 'x')} onRetry={() => undefined} />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('No se pudo conectar con el servidor')).toBeTruthy();
  });

  it('calls onRetry when the button is pressed', () => {
    const onRetry = vi.fn();
    render(<ErrorScreen error={new ApiError('timeout', 'x')} onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('marks the server as the stop that failed when it cannot be reached', () => {
    const { container } = render(
      <ErrorScreen error={new ApiError('network', 'x')} onRetry={() => undefined} />,
    );
    expect(container.querySelector('.route__stop--failed')?.textContent).toContain('Servidor');
  });

  it('marks the database as the stop that failed on a 503', () => {
    const { container } = render(
      <ErrorScreen error={new ApiError('http', 'x', 503)} onRetry={() => undefined} />,
    );
    expect(container.querySelector('.route__stop--failed')?.textContent).toContain('Base de datos');
    expect(screen.getByText(/la base de datos no está disponible/)).toBeTruthy();
  });
});
