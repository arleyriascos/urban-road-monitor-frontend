import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { GoogleCredentialResponse, GoogleIdApi } from '../lib/google-identity';
import { GoogleSignInButton } from './GoogleSignInButton';

function fakeGoogle() {
  let callback: (response: GoogleCredentialResponse) => void = () => {};
  const api: GoogleIdApi = {
    initialize: vi.fn((config) => {
      callback = config.callback;
    }),
    renderButton: vi.fn(),
  };
  return { api, send: (credential: string) => callback({ credential }) };
}

describe('GoogleSignInButton', () => {
  it("asks Google to draw its button, in Spanish, for this app's client id", async () => {
    const { api } = fakeGoogle();
    render(
      <GoogleSignInButton
        clientId="client-123"
        onCredential={vi.fn()}
        load={() => Promise.resolve(api)}
      />,
    );

    await waitFor(() => expect(api.renderButton).toHaveBeenCalledOnce());

    expect(api.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 'client-123', auto_select: false }),
    );
    const [parent, options] = vi.mocked(api.renderButton).mock.calls[0]!;
    expect(parent).toBeInstanceOf(HTMLElement);
    expect(options).toMatchObject({ locale: 'es', text: 'signin_with', size: 'large' });
  });

  it('says it is loading until Google answers, then hides the note', async () => {
    const { api } = fakeGoogle();
    render(
      <GoogleSignInButton clientId="c" onCredential={vi.fn()} load={() => Promise.resolve(api)} />,
    );
    expect(screen.getByRole('status').textContent).toContain('Cargando');

    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
  });

  it('hands the credential to the page when the person finishes in Google', async () => {
    const { api, send } = fakeGoogle();
    const onCredential = vi.fn();
    render(
      <GoogleSignInButton
        clientId="c"
        onCredential={onCredential}
        load={() => Promise.resolve(api)}
      />,
    );
    await waitFor(() => expect(api.renderButton).toHaveBeenCalled());

    act(() => send('the-id-token'));

    expect(onCredential).toHaveBeenCalledExactlyOnceWith('the-id-token');
  });

  it('uses the latest callback of the page, not the first one', async () => {
    const { api, send } = fakeGoogle();
    const first = vi.fn();
    const second = vi.fn();
    const load = () => Promise.resolve(api);
    const { rerender } = render(
      <GoogleSignInButton clientId="c" onCredential={first} load={load} />,
    );
    await waitFor(() => expect(api.renderButton).toHaveBeenCalled());

    rerender(<GoogleSignInButton clientId="c" onCredential={second} load={load} />);
    act(() => send('t'));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('t');
  });

  it('tells the person when Google did not load and tries again from the button', async () => {
    const { api } = fakeGoogle();
    const load = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValue(api);
    render(<GoogleSignInButton clientId="c" onCredential={vi.fn()} load={load} />);

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo cargar');

    fireEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));

    await waitFor(() => expect(api.renderButton).toHaveBeenCalledOnce());
    expect(load).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('does not draw anything if it went away before Google answered', async () => {
    const { api } = fakeGoogle();
    let finish: (value: GoogleIdApi) => void = () => {};
    const load = () => new Promise<GoogleIdApi>((resolve) => (finish = resolve));
    const { unmount } = render(
      <GoogleSignInButton clientId="c" onCredential={vi.fn()} load={load} />,
    );

    unmount();
    await act(async () => finish(api));

    expect(api.renderButton).not.toHaveBeenCalled();
  });
});
