import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DetectionLoopOptions } from '../detection/detection-loop';
import type { DetectionResult, Detector } from '../detection/detector';
import type { LoadedModel } from '../detection/model-session';
import type { CameraPageDependencies } from './CameraPage';
import { CameraPage } from './CameraPage';

const RESULT: DetectionResult = {
  detections: [{ x: 10, y: 10, width: 200, height: 100, score: 0.9 }],
  frame: { width: 1000, height: 500 },
  timings: { captureMs: 2, inferenceMs: 100, totalMs: 110 },
};

afterEach(() => vi.restoreAllMocks());

function setup() {
  const stopTracks = vi.fn();
  const stream = {} as MediaStream;
  const detector: Detector = { detect: vi.fn() };
  const release = vi.fn(async () => undefined);
  const loaded: LoadedModel = {
    session: { run: vi.fn(), release },
    downloadMs: 1500,
    startMs: 300,
  };
  const loops: DetectionLoopOptions[] = [];
  const loop = { start: vi.fn(), stop: vi.fn(), isRunning: vi.fn(() => false) };
  const dependencies: CameraPageDependencies = {
    camera: { openCamera: vi.fn(async () => ({ stream, stop: stopTracks })) },
    model: { loadModel: vi.fn(async () => loaded), makeDetector: () => detector },
    detection: {
      createLoop: (options) => {
        loops.push(options);
        return loop;
      },
      isHidden: () => false,
      now: () => 0,
      onVisibilityChange: () => () => undefined,
    },
  };
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  return { dependencies, stopTracks, stream, loops, loop, release };
}

describe('CameraPage', () => {
  it('does not ask for the camera or download the model until the person asks', () => {
    const { dependencies } = setup();
    render(<CameraPage dependencies={dependencies} />);
    expect(dependencies.camera?.openCamera).not.toHaveBeenCalled();
    expect(dependencies.model?.loadModel).not.toHaveBeenCalled();
  });

  it('turns on the camera and loads the model together, then starts detecting', async () => {
    const { dependencies, loop } = setup();
    render(<CameraPage dependencies={dependencies} />);

    fireEvent.click(screen.getByRole('button', { name: 'Activar la cámara' }));

    await waitFor(() => expect(loop.start).toHaveBeenCalled());
    expect(dependencies.camera?.openCamera).toHaveBeenCalledOnce();
    expect(dependencies.model?.loadModel).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Apagar la cámara' })).toBeTruthy();
  });

  it('plays the stream of the camera in the video', async () => {
    const { dependencies, stream } = setup();
    const { container } = render(<CameraPage dependencies={dependencies} />);

    fireEvent.click(screen.getByRole('button', { name: 'Activar la cámara' }));

    const video = container.querySelector('video') as HTMLVideoElement;
    await waitFor(() => expect(video.srcObject).toBe(stream));
  });

  it('shows the boxes and the readings of each detection', async () => {
    const { dependencies, loops, loop } = setup();
    render(<CameraPage dependencies={dependencies} />);
    fireEvent.click(screen.getByRole('button', { name: 'Activar la cámara' }));
    await waitFor(() => expect(loop.start).toHaveBeenCalled());

    act(() => loops[0].onResult(RESULT));

    expect(screen.getByText('1 bache a la vista')).toBeTruthy();
    expect(screen.getByText('110 ms')).toBeTruthy();
  });

  it('turns off the camera and the detection when the person asks', async () => {
    const { dependencies, stopTracks, loop } = setup();
    render(<CameraPage dependencies={dependencies} />);
    fireEvent.click(screen.getByRole('button', { name: 'Activar la cámara' }));
    await waitFor(() => expect(loop.start).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Apagar la cámara' }));

    expect(stopTracks).toHaveBeenCalledOnce();
    expect(loop.stop).toHaveBeenCalled();
    expect(screen.getByText('La cámara está apagada.')).toBeTruthy();
  });

  it('explains it when the person does not allow the camera', async () => {
    const { dependencies } = setup();
    dependencies.camera = {
      openCamera: vi.fn(async () => {
        throw new DOMException('no', 'NotAllowedError');
      }),
    };
    render(<CameraPage dependencies={dependencies} />);

    fireEvent.click(screen.getByRole('button', { name: 'Activar la cámara' }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/permiso/);
  });

  it('turns everything off when the person leaves', async () => {
    const { dependencies, stopTracks, release, loop } = setup();
    const { unmount } = render(<CameraPage dependencies={dependencies} />);
    fireEvent.click(screen.getByRole('button', { name: 'Activar la cámara' }));
    await waitFor(() => expect(loop.start).toHaveBeenCalled());

    unmount();

    expect(stopTracks).toHaveBeenCalledOnce();
    expect(release).toHaveBeenCalledOnce();
  });
});

describe('CameraPage and the saving of potholes', () => {
  it('tells a guest that nothing is saved, and does not ask for the position', async () => {
    const { dependencies } = setup();
    const watch = vi.fn(() => () => undefined);
    render(
      <CameraPage
        dependencies={{
          ...dependencies,
          access: { store: { readToken: () => null }, getMe: vi.fn() },
          geolocation: { watch },
        }}
      />,
    );
    expect(screen.getByText(/Ingresa con tu cuenta de Google/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Activar la cámara' }));
    await screen.findByRole('button', { name: 'Apagar la cámara' });
    await waitFor(() => expect(HTMLMediaElement.prototype.play).toHaveBeenCalled());
    expect(watch).not.toHaveBeenCalled();
  });

  it('follows the position and tells a collaborator that the potholes are saved', async () => {
    const { dependencies } = setup();
    const watch = vi.fn(() => () => undefined);
    const getMe = vi.fn(async () => ({
      id: 'u1',
      email: 'ana@example.com',
      fullName: 'Ana',
      avatarUrl: null,
      roles: ['colaborador'],
      permissions: ['detections.create'],
    }));
    render(
      <CameraPage
        dependencies={{
          ...dependencies,
          access: { store: { readToken: () => 'a'.repeat(43) }, getMe },
          geolocation: { watch },
        }}
      />,
    );
    await waitFor(() => expect(screen.getByText(/se guardan y se envían/)).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: 'Activar la cámara' }));
    await waitFor(() => expect(watch).toHaveBeenCalled());
    await waitFor(() => expect(HTMLMediaElement.prototype.play).toHaveBeenCalled());
  });
});
