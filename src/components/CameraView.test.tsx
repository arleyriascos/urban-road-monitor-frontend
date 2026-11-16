import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CameraState } from '../hooks/useCamera';
import type { DetectionState } from '../hooks/useDetection';
import type { ModelState } from '../hooks/useDetectorModel';
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
      camera: { status: 'error', error: { kind: 'denied', message: 'No tenemos permiso.' } },
    });
    expect(screen.getByRole('alert').textContent).toBe('No tenemos permiso.');
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
    renderView({ model: { status: 'error', message: 'No pudimos cargar el modelo.' } });
    expect(screen.getByRole('alert').textContent).toBe('No pudimos cargar el modelo.');
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
});
