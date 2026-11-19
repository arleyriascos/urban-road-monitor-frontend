import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CameraState } from '../hooks/useCamera';
import type { DetectionState } from '../hooks/useDetection';
import type { ModelState } from '../hooks/useDetectorModel';
import { renderInEnglish } from '../test/english';
import { CameraView, type CameraViewProps } from './CameraView';

const NO_DETECTION: DetectionState = { latest: null, reading: null, error: null };

function renderView(overrides: Partial<CameraViewProps> = {}) {
  const props: CameraViewProps = {
    camera: { status: 'off' } as CameraState,
    model: { status: 'idle' } as ModelState,
    detection: NO_DETECTION,
    sending: { messages: [{ tone: 'info', text: 'Ingresa con tu cuenta' }], counts: null },
    onStart: vi.fn(),
    onStop: vi.fn(),
    videoRef: vi.fn(),
    ...overrides,
  };
  render(<CameraView {...props} />);
  return props;
}

describe('CameraView', () => {
  it('starts with the camera off, the privacy note and a button to turn it on', () => {
    const props = renderView();
    expect(screen.getByText('La cámara está apagada.')).toBeTruthy();
    expect(screen.getByText(/no salen de él/)).toBeTruthy();
    expect(screen.getByText(/Solo se envía, con tu cuenta/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Activar la cámara' }));
    expect(props.onStart).toHaveBeenCalledOnce();
  });

  it('tells what happens to the potholes', () => {
    renderView({
      sending: {
        messages: [{ tone: 'warning', text: 'No se pudo enviar por ahora.' }],
        counts: { stored: 2, pending: 1 },
      },
    });
    expect(screen.getByText('No se pudo enviar por ahora.')).toBeTruthy();
    expect(screen.getByText('Enviados')).toBeTruthy();
  });

  it('has a link back to the map', () => {
    renderView();
    expect(screen.getByRole('link', { name: 'Volver al mapa' }).getAttribute('href')).toBe('/');
  });

  it('gives the video element to the page', () => {
    const props = renderView();
    expect(props.videoRef).toHaveBeenCalledWith(expect.any(HTMLVideoElement));
  });

  it('says the camera is opening and offers to cancel', () => {
    const props = renderView({ camera: { status: 'opening' } });
    expect(screen.getByText('Abriendo la cámara…')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Apagar la cámara' }));
    expect(props.onStop).toHaveBeenCalledOnce();
  });

  it('explains a camera error and lets the person try again', () => {
    const props = renderView({
      camera: { status: 'error', error: { kind: 'denied' } },
    });
    expect(screen.getByRole('alert').textContent).toMatch(/No tenemos permiso para usar la cámara/);
    fireEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    expect(props.onStart).toHaveBeenCalledOnce();
  });

  it('shows the progress of the download of the model', () => {
    const { rerender } = render(
      <CameraView
        camera={{ status: 'opening' }}
        model={{ status: 'loading', progress: null }}
        detection={NO_DETECTION}
        sending={{ messages: [], counts: null }}
        onStart={vi.fn()}
        onStop={vi.fn()}
        videoRef={vi.fn()}
      />,
    );
    expect(screen.getByText('Descargando el modelo de detección…')).toBeTruthy();
    rerender(
      <CameraView
        camera={{ status: 'opening' }}
        model={{ status: 'loading', progress: { loadedBytes: 50, totalBytes: 200 } }}
        detection={NO_DETECTION}
        sending={{ messages: [], counts: null }}
        onStart={vi.fn()}
        onStop={vi.fn()}
        videoRef={vi.fn()}
      />,
    );
    expect(screen.getByText('Descargando el modelo de detección: 25 %')).toBeTruthy();
  });

  it('tells a failure of the model as an alert', () => {
    renderView({ model: { status: 'error', reason: 'unknown' } });
    expect(screen.getByRole('alert').textContent).toBe('No pudimos cargar el modelo de detección.');
  });

  it('says it is looking while the camera is on and the model ready but nothing was analyzed yet', () => {
    renderView({
      camera: { status: 'on', stream: {} as MediaStream },
      model: { status: 'ready', detector: { detect: vi.fn() }, downloadMs: 10, startMs: 5 },
    });
    expect(screen.getByText('Buscando baches…')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Apagar la cámara' })).toBeTruthy();
    expect(screen.queryByText('La cámara está apagada.')).toBeNull();
  });

  it('shows both meters with the readings', () => {
    renderView({
      camera: { status: 'on', stream: {} as MediaStream },
      model: { status: 'ready', detector: { detect: vi.fn() }, downloadMs: 2400, startMs: 600 },
      detection: {
        latest: {
          detections: [],
          frame: { width: 640, height: 480 },
          timings: { captureMs: 1, inferenceMs: 2, totalMs: 3 },
        },
        reading: {
          performance: { fps: 3, inferenceMs: 150, totalMs: 170 },
          size: {
            boxes: [{ ratio: 0.05, severity: 'grave', score: 0.9 }],
            counts: { leve: 0, moderado: 0, grave: 1 },
            averageRatio: 0.05,
          },
        },
        error: null,
      },
    });
    expect(screen.getByRole('region', { name: 'Rendimiento' })).toBeTruthy();
    expect(screen.getByText('150 ms')).toBeTruthy();
    expect(screen.getByText('1 bache a la vista')).toBeTruthy();
    expect(screen.queryByText('Buscando baches…')).toBeNull();
  });

  it('shows over the video that it is detecting and how fast, only while it runs', () => {
    renderView({
      camera: { status: 'on', stream: {} as MediaStream },
      model: { status: 'ready', detector: { detect: vi.fn() }, downloadMs: 2400, startMs: 600 },
      detection: {
        latest: null,
        reading: {
          performance: { fps: 3, inferenceMs: 150, totalMs: 170 },
          size: { boxes: [], counts: { leve: 0, moderado: 0, grave: 0 }, averageRatio: 0 },
        },
        error: null,
      },
    });
    expect(screen.getByText('Detectando')).toBeTruthy();
    expect(screen.getByText('3,0 det/s')).toBeTruthy();
    expect(screen.getByText('170 ms por cuadro')).toBeTruthy();
  });

  it('shows nothing over the video while the camera is off', () => {
    renderView();
    expect(screen.queryByText('Detectando')).toBeNull();
  });
});

describe('CameraView in English', () => {
  function renderInEnglishView(overrides: Partial<CameraViewProps> = {}) {
    const props: CameraViewProps = {
      camera: { status: 'off' } as CameraState,
      model: { status: 'idle' } as ModelState,
      detection: NO_DETECTION,
      sending: {
        messages: [{ tone: 'info', text: 'Sign in' }],
        counts: { stored: 1250, pending: 2 },
      },
      onStart: vi.fn(),
      onStop: vi.fn(),
      videoRef: vi.fn(),
      ...overrides,
    };
    renderInEnglish(<CameraView {...props} />);
    return props;
  }

  it('starts with the camera off, the privacy note and a button to turn it on', () => {
    const props = renderInEnglishView();
    expect(screen.getByText('The camera is off.')).toBeTruthy();
    expect(screen.getByText(/never leave it/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to the map' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Turn the camera on' }));
    expect(props.onStart).toHaveBeenCalledOnce();
  });

  it('counts what was sent with English separators', () => {
    renderInEnglishView();
    expect(screen.getByText('Sent').nextElementSibling?.textContent).toBe('1,250');
    expect(screen.getByText('Waiting')).toBeTruthy();
  });

  it('explains a camera error and lets the person try again, in English', () => {
    const props = renderInEnglishView({ camera: { status: 'error', error: { kind: 'busy' } } });
    expect(screen.getByRole('alert').textContent).toBe(
      'The camera is in use by another app. Close it and try again.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(props.onStart).toHaveBeenCalledOnce();
  });

  it('says how the download of the model goes, and why it failed', () => {
    renderInEnglishView({ model: { status: 'loading', progress: null } });
    expect(screen.getByText('Downloading the detection model…')).toBeTruthy();
  });

  it('tells a failure of the model as an alert', () => {
    renderInEnglishView({ model: { status: 'error', reason: 'failed' } });
    expect(screen.getByRole('alert').textContent).toBe(
      'We could not load the detection model. Check your connection and try again.',
    );
  });

  it('shows the speed of the detection over the video in English', () => {
    renderInEnglishView({
      camera: { status: 'on', stream: {} as MediaStream },
      model: { status: 'ready', detector: {} as never, downloadMs: 10, startMs: 10 },
      detection: {
        latest: null,
        error: null,
        reading: {
          performance: { fps: 2.94, inferenceMs: 180, totalMs: 1840 },
          size: { boxes: [], counts: { leve: 0, moderado: 0, grave: 0 }, averageRatio: null },
        },
      },
    });
    expect(screen.getByText('Detecting')).toBeTruthy();
    expect(screen.getByText('2.9 det/s')).toBeTruthy();
    expect(screen.getByText('1.8 s per frame')).toBeTruthy();
    expect(screen.getByText('Looking for potholes…')).toBeTruthy();
  });
});
