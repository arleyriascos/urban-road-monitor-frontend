import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderInEnglish } from '../test/english';
import { PRIVACY_CONTACT_EMAIL, PrivacyPage } from './PrivacyPage';
import { PrivacyContentEn, PrivacyContentEs } from './privacy-content';

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

  it('says the password is never kept and that changing it closes the other sessions', () => {
    render(<PrivacyPage />);
    const text = document.body.textContent ?? '';
    for (const part of [
      'nunca se guarda: solo se guarda una huella cifrada',
      'Al cambiarla se cierran tus otras sesiones',
      'cambio de contraseña',
      'las contraseñas',
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
      'usas el detector con tu cuenta',
      'se conservan aunque la cuenta se desactive',
    ]) {
      expect(text).toContain(part);
    }
  });

  it('says the queue of the browser is deleted once the server has the potholes', () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/hasta 500/)).toBeTruthy();
  });

  it('tells a guest that the detector asks to sign in', () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/pide ingresar con Google/)).toBeTruthy();
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
      'Qué datos guardamos si creas una cuenta con correo y contraseña',
      'Qué guarda tu navegador',
      'Los baches que detecta la cámara',
      'Si entras como invitado',
      'Para qué usamos los datos',
      'Servicios que intervienen',
      'Tus derechos',
    ]);
  });
});

describe('PrivacyPage in English', () => {
  it('has one title, the date of the last update and a way back, in English', () => {
    renderInEnglish(<PrivacyPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeTruthy();
    expect(screen.getByText('Last updated: November 20, 2026')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to the app' }).getAttribute('href')).toBe('/');
  });

  it('has a heading for every topic, in the same order as in Spanish', () => {
    renderInEnglish(<PrivacyPage />);
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'Who is responsible',
      'What data we keep if you sign in with Google',
      'What data we keep if you create an account with an email and a password',
      'What your browser keeps',
      'The potholes the camera detects',
      'If you enter as a guest',
      'What we use the data for',
      'Services involved',
      'Your rights',
    ]);
  });

  it('keeps the promises of the Spanish text: no pictures, no sale, no tracking, no tokens', () => {
    renderInEnglish(<PrivacyPage />);
    const text = document.body.textContent ?? '';
    for (const part of [
      'no photo or video is saved or sent',
      'We do not sell or share your data',
      'We do not use tracking or advertising cookies',
      'Google tokens, passwords and session identifiers are not kept',
      '7 days',
      '30 days',
      'up to 500',
      'Vercel',
      'Render',
      'Neon',
    ]) {
      expect(text).toContain(part);
    }
  });

  it('says the same about the password in English', () => {
    renderInEnglish(<PrivacyPage />);
    const text = document.body.textContent ?? '';
    for (const part of [
      'is never kept: only an encrypted fingerprint',
      'your other sessions are closed',
      'change of password',
    ]) {
      expect(text).toContain(part);
    }
  });

  it('gives the same mail link to ask for the data as the Spanish text', () => {
    renderInEnglish(<PrivacyPage />);
    const link = screen.getByRole('link', { name: PRIVACY_CONTACT_EMAIL });
    expect(link.getAttribute('href')).toBe(`mailto:${PRIVACY_CONTACT_EMAIL}`);
  });
});

describe('the two languages of the privacy policy', () => {
  function shapeOf(locale: 'es' | 'en') {
    const { container, unmount } = render(
      locale === 'en' ? <PrivacyContentEn email="a@b.co" /> : <PrivacyContentEs email="a@b.co" />,
    );
    const shape = {
      headings: container.querySelectorAll('h2').length,
      paragraphs: container.querySelectorAll('p').length,
      items: container.querySelectorAll('li').length,
      strong: container.querySelectorAll('strong').length,
      links: [...container.querySelectorAll('a')].map((link) => link.getAttribute('href')),
    };
    unmount();
    return shape;
  }

  it('have the same shape, so one cannot say more than the other', () => {
    expect(shapeOf('en')).toEqual(shapeOf('es'));
  });
});
