import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { OpenCamera } from '../camera/open-camera';
import { useCamera } from './useCamera';

function fakeCamera() {
  const stop = vi.fn<() => void>();
  const camera: OpenCamera = { stream: {} as MediaStream, stop };
  return Object.assign(camera, { stopSpy: stop });
}

describe('useCamera', () => {
  it('starts off and does not ask for the camera until told to', () => {
    const openCamera = vi.fn();
    const { result } = renderHook(() => useCamera({ openCamera }));
    expect(result.current.state).toEqual({ status: 'off' });
    expect(openCamera).not.toHaveBeenCalled();
  });

  it('goes through opening to on', async () => {
    const camera = fakeCamera();
    const { result } = renderHook(() => useCamera({ openCamera: async () => camera }));

    act(() => result.current.start());
    expect(result.current.state.status).toBe('opening');

    await waitFor(() => expect(result.current.state.status).toBe('on'));
    expect(result.current.state).toEqual({ status: 'on', stream: camera.stream });
  });

  it('explains the error when the camera does not open', async () => {
    const { result } = renderHook(() =>
      useCamera({
        openCamera: async () => {
          throw new DOMException('no', 'NotAllowedError');
        },
      }),
    );
    act(() => result.current.start());
    await waitFor(() => expect(result.current.state.status).toBe('error'));
    expect(result.current.state).toMatchObject({ status: 'error', error: { kind: 'denied' } });
  });

  it('turns the camera off when stopped', async () => {
    const camera = fakeCamera();
    const { result } = renderHook(() => useCamera({ openCamera: async () => camera }));
    act(() => result.current.start());
    await waitFor(() => expect(result.current.state.status).toBe('on'));

    act(() => result.current.stop());

    expect(camera.stopSpy).toHaveBeenCalledOnce();
    expect(result.current.state).toEqual({ status: 'off' });
  });

  it('turns the camera off when the screen is left', async () => {
    const camera = fakeCamera();
    const { result, unmount } = renderHook(() => useCamera({ openCamera: async () => camera }));
    act(() => result.current.start());
    await waitFor(() => expect(result.current.state.status).toBe('on'));

    unmount();

    expect(camera.stopSpy).toHaveBeenCalledOnce();
  });

  it('turns off a camera that opens after the screen was left', async () => {
    const camera = fakeCamera();
    let finish: (camera: OpenCamera) => void = () => undefined;
    const openCamera = () => new Promise<OpenCamera>((resolve) => (finish = resolve));
    const { result, unmount } = renderHook(() => useCamera({ openCamera }));
    act(() => result.current.start());

    unmount();
    await act(async () => finish(camera));

    expect(camera.stopSpy).toHaveBeenCalledOnce();
  });

  it('does not open a second camera while one is on', async () => {
    const openCamera = vi.fn(async () => fakeCamera());
    const { result } = renderHook(() => useCamera({ openCamera }));
    act(() => result.current.start());
    await waitFor(() => expect(result.current.state.status).toBe('on'));

    act(() => result.current.start());

    expect(openCamera).toHaveBeenCalledOnce();
  });
});
