import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderInEnglish } from '../test/english';
import { CameraGate } from './CameraGate';

describe('CameraGate', () => {
  it('asks the guest to sign in and offers to go back to the map', () => {
    render(<CameraGate onSignIn={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Detector de baches' })).toBeTruthy();
    expect(screen.getByText(/necesitas ingresar con tu cuenta de Google/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Volver al mapa' }).getAttribute('href')).toBe('/');
  });

  it('says what a guest can still do and that no image leaves the device', () => {
    render(<CameraGate onSignIn={vi.fn()} />);

    expect(screen.getByText(/ver el mapa, buscar calles y trazar rutas/)).toBeTruthy();
    expect(screen.getByText(/nunca salen de tu dispositivo/)).toBeTruthy();
  });

  it('calls onSignIn from the button', () => {
    const onSignIn = vi.fn();
    render(<CameraGate onSignIn={onSignIn} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ingresar con Google' }));

    expect(onSignIn).toHaveBeenCalledOnce();
  });

  it('has no camera control: nothing is asked of the device', () => {
    render(<CameraGate onSignIn={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Activar la cámara' })).toBeNull();
    expect(document.querySelector('video')).toBeNull();
  });
});

describe('CameraGate in English', () => {
  it('asks a guest to sign in, in English', () => {
    const onSignIn = vi.fn();
    renderInEnglish(<CameraGate onSignIn={onSignIn} />);
    expect(screen.getByRole('link', { name: 'Back to the map' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Pothole detector' })).toBeTruthy();
    expect(screen.getByText(/you need to sign in with your Google account/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });
});
