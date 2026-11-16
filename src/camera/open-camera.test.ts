import { describe, expect, it, vi } from 'vitest';
import { CAMERA_CONSTRAINTS, openCamera } from './open-camera';

function fakeStream() {
  const stop = vi.fn();
  const stream = { getTracks: () => [{ stop }, { stop }] } as unknown as MediaStream;
  return { stream, stop };
}

describe('openCamera', () => {
  it('asks for the rear camera without sound', async () => {
    const { stream } = fakeStream();
    const getUserMedia = vi.fn(async () => stream);

    const camera = await openCamera({ getUserMedia });

    expect(getUserMedia).toHaveBeenCalledWith(CAMERA_CONSTRAINTS);
    expect(CAMERA_CONSTRAINTS.audio).toBe(false);
    expect(CAMERA_CONSTRAINTS.video).toMatchObject({ facingMode: { ideal: 'environment' } });
    expect(camera.stream).toBe(stream);
  });

  it('turns off every track when stopped', async () => {
    const { stream, stop } = fakeStream();
    const camera = await openCamera({ getUserMedia: async () => stream });
    camera.stop();
    expect(stop).toHaveBeenCalledTimes(2);
  });

  it('passes on the error of the browser', async () => {
    const denied = new DOMException('no', 'NotAllowedError');
    await expect(
      openCamera({
        getUserMedia: async () => {
          throw denied;
        },
      }),
    ).rejects.toBe(denied);
  });

  it('fails with a not-supported error when the browser has no camera access', async () => {
    await expect(openCamera(null)).rejects.toMatchObject({ name: 'NotSupportedError' });
  });
});
