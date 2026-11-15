import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import { SLOW_REQUEST_MS } from '../hooks/useMapData';
import { SessionCheckScreen } from './SessionCheckScreen';

afterEach(() => {
  vi.useRealTimers();
});

describe('SessionCheckScreen', () => {
  it('says the session is being checked and offers nothing yet', () => {
    render(<SessionCheckScreen unreachable={null} onRetry={vi.fn()} onSkip={vi.fn()} />);

    expect(screen.getByText('Comprobando tu sesión…')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('after a few seconds explains the sleeping server and offers the guest mode', () => {
    vi.useFakeTimers();
    const onSkip = vi.fn();
    render(<SessionCheckScreen unreachable={null} onRetry={vi.fn()} onSkip={onSkip} />);

    act(() => {
      vi.advanceTimersByTime(SLOW_REQUEST_MS);
    });

    expect(screen.getByText(/despertando/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Seguir como invitado por ahora' }));
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it('when the server did not answer says so, that the session is kept, and lets the person retry', () => {
    const onRetry = vi.fn();
    render(
      <SessionCheckScreen
        unreachable={new ApiError('timeout', 'slow')}
        onRetry={onRetry}
        onSkip={vi.fn()}
      />,
    );

    expect(screen.getByText('El servidor no respondió a tiempo')).toBeTruthy();
    expect(screen.getByText(/Tu sesión sigue guardada/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it.each([
    [new ApiError('network', 'down'), 'No se pudo conectar con el servidor'],
    [
      new ApiError('http', 'x', 503),
      'El servidor respondió, pero la base de datos no está disponible',
    ],
  ])('names the problem: %j', (error, title) => {
    render(<SessionCheckScreen unreachable={error} onRetry={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(title)).toBeTruthy();
  });

  it('stops its timer when it goes away', () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <SessionCheckScreen unreachable={null} onRetry={vi.fn()} onSkip={vi.fn()} />,
    );

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
