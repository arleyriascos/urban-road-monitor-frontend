import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PRIVACY_CONTACT_EMAIL, PrivacyPage } from './PrivacyPage';

describe('PrivacyPage', () => {
  it('has one title and says who is responsible, and that it is not commercial', () => {
    render(<PrivacyPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Política de privacidad' })).toBeTruthy();
    expect(
      screen.getByText(/proyecto académico de la asignatura Estructuras de Datos/),
    ).toBeTruthy();
    expect(screen.getByText(/Universidad Cooperativa de Colombia/)).toBeTruthy();
    expect(screen.getByText(/No es un servicio comercial/)).toBeTruthy();
  });

  it('says what is kept if the person signs in with Google', () => {
    render(<PrivacyPage />);

    const text = document.body.textContent ?? '';
    for (const part of [
      'correo',
      'nombre',
      'foto',
      'sesión',
      '7 días',
      '30 días',
      'registro de accesos',
      'rol',
    ]) {
      expect(text).toContain(part);
    }
  });

  it('says what the browser keeps and that there is no tracking', () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/no usamos cookies de seguimiento/i)).toBeTruthy();
  });

  it('says nothing is kept from a guest', () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/no te pide ningún dato ni guarda nada tuyo/)).toBeTruthy();
  });

  it('says what is sent when the camera detects a pothole, and that no picture leaves', () => {
    render(<PrivacyPage />);
    const text = document.body.textContent ?? '';
    for (const part of [
      'no se guarda ni se envía ninguna foto ni video',
      'ubicación del teléfono',
      'colaborador',
      'se conservan aunque la cuenta se desactive',
    ]) {
      expect(text).toContain(part);
    }
  });

  it('says the queue of the browser is deleted once the server has the potholes', () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/hasta 500/)).toBeTruthy();
  });

  it('tells a guest that the camera does not save anything', () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/pero no se guardan ni se envían/)).toBeTruthy();
  });

  it('names the services that take part', () => {
    render(<PrivacyPage />);
    const text = document.body.textContent ?? '';
    for (const service of ['Google', 'Vercel', 'Render', 'Neon']) expect(text).toContain(service);
  });

  it('tells how to ask to see, correct or delete the data, with a working mail link', () => {
    render(<PrivacyPage />);

    const link = screen.getByRole('link', { name: PRIVACY_CONTACT_EMAIL });
    expect(link.getAttribute('href')).toBe(`mailto:${PRIVACY_CONTACT_EMAIL}`);
    expect(screen.getByText(/se desactiva y se anonimiza/)).toBeTruthy();
  });

  it('does not promise what the app does not do: no sale, no tracking, no tokens kept', () => {
    render(<PrivacyPage />);
    const text = document.body.textContent ?? '';
    expect(text).toContain('No vendemos ni compartimos');
    expect(text).toContain('No se guardan los tokens de Google');
  });

  it('links back to the app', () => {
    render(<PrivacyPage />);
    expect(screen.getByRole('link', { name: 'Volver a la app' }).getAttribute('href')).toBe('/');
  });

  it('has a heading for every topic, in order', () => {
    render(<PrivacyPage />);
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'Quién es responsable',
      'Qué datos guardamos si ingresas con Google',
      'Qué guarda tu navegador',
      'Los baches que detecta la cámara',
      'Si entras como invitado',
      'Para qué usamos los datos',
      'Servicios que intervienen',
      'Tus derechos',
    ]);
  });
});
