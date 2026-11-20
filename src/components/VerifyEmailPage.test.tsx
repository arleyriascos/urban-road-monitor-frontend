import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import { renderInEnglish } from '../test/english';
import { VerifyEmailPage } from './VerifyEmailPage';

const TOKEN = 'Ab3_-'.repeat(8) + 'xyz';

function openLink(hash = `#token=${TOKEN}`) {
  window.history.replaceState(null, '', `/verificar${hash}`);
}

beforeEach(() => {
  window.localStorage.clear();
  openLink();
});

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('VerifyEmailPage', () => {
  it('spends the token of the link, takes it out of the address and says it is done', async () => {
    const verify = vi.fn(async () => ({ verified: true as const }));
    render(<VerifyEmailPage verify={verify} />);

    expect(screen.getByRole('status').textContent).toContain('Verificando');
    expect(await screen.findByRole('heading', { level: 1 })).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('verificado'),
    );
    expect(verify).toHaveBeenCalledWith(TOKEN);
    expect(window.location.hash).toBe('');
    expect(window.location.pathname).toBe('/verificar');
    expect(screen.getByRole('link', { name: 'Ir al inicio' }).getAttribute('href')).toBe('/');
  });

  it('spends the token only once, even when React runs the effect twice', async () => {
    const verify = vi.fn(async () => ({ verified: true as const }));
    render(
      <StrictMode>
        <VerifyEmailPage verify={verify} />
      </StrictMode>,
    );

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('verificado'),
    );
    expect(verify).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['there is no token', ''],
    ['the token has the wrong shape', '#token=corto'],
  ])('says the link does not work when %s, without asking the server', (_name, hash) => {
    openLink(hash);
    const verify = vi.fn();
    render(<VerifyEmailPage verify={verify} />);

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Este enlace ya no sirve');
    expect(screen.getByRole('link', { name: 'Ir a Configuraciones' }).getAttribute('href')).toBe(
      '/cuenta/configuraciones',
    );
    expect(verify).not.toHaveBeenCalled();
  });

  it('says the link does not work when the server refuses it', async () => {
    const verify = vi.fn().mockRejectedValue(new ApiError('http', 'x', 400, 'INVALID_TOKEN'));
    render(<VerifyEmailPage verify={verify} />);

    expect((await screen.findByRole('alert')).textContent).toContain('venció');
    expect(screen.queryByRole('button', { name: 'Intentar de nuevo' })).toBeNull();
  });

  it.each([
    [new ApiError('timeout', 'x'), 'despertando'],
    [new ApiError('network', 'x'), 'Revisa tu conexión'],
    [new ApiError('http', 'x', 500, 'INTERNAL'), 'No se pudo verificar el correo'],
  ])(
    'lets the person try again when the server did not answer well (%#)',
    async (failure, text) => {
      const verify = vi
        .fn()
        .mockRejectedValueOnce(failure)
        .mockResolvedValueOnce({ verified: true });
      render(<VerifyEmailPage verify={verify} />);

      expect((await screen.findByRole('alert')).textContent).toContain(text);
      fireEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));

      await waitFor(() =>
        expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('verificado'),
      );
      expect(verify).toHaveBeenCalledTimes(2);
      expect(verify).toHaveBeenLastCalledWith(TOKEN);
    },
  );

  it('writes in English for a person who chose it', async () => {
    window.localStorage.setItem('urban-road-monitor.language', 'en');
    renderInEnglish(<VerifyEmailPage verify={vi.fn(async () => ({ verified: true as const }))} />);

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
        'Done: your email is verified',
      ),
    );
    expect(screen.getByRole('link', { name: 'Go to the start' })).toBeTruthy();
  });
});
