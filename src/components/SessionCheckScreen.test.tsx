import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import { SLOW_REQUEST_MS } from '../hooks/useMapData';
import { renderInEnglish } from '../test/english';
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

describe('SessionCheckScreen in English', () => {
  it('says the session is being checked, and lets a person retry or go on as a guest', () => {
    const onRetry = vi.fn();
    const onSkip = vi.fn();
    renderInEnglish(
      <SessionCheckScreen
        unreachable={new ApiError('network', 'down')}
        onRetry={onRetry}
        onSkip={onSkip}
      />,
    );
    expect(screen.getByText('Could not connect to the server')).toBeTruthy();
    expect(screen.getByText(/Your session is still saved/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue as a guest for now' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
