import { describe, expect, it } from 'vitest';
import { potholesFixture, segmentsFixture } from '../test/fixtures';
import { potholePopupHtml, segmentPopupHtml } from './popups';

const [clean, severe, longStreet] = segmentsFixture.features.map((feature) => feature.properties);
const [confirmed] = potholesFixture.features.map((feature) => feature.properties);

describe('segmentPopupHtml', () => {
  it('shows the name, type, severity and the facts of a severe one-way street', () => {
    const html = segmentPopupHtml(severe);
    expect(html).toContain('Calle sin nombre');
    expect(html).toContain('Vía terciaria');
    expect(html).toContain('Grave');
    expect(html).toContain('background:#DC2626');
    expect(html).toContain('98 m');
    expect(html).toContain('Un solo sentido');
    expect(html).toContain('×6,9');
  });

  it('shows two-way streets and the street name when there is one', () => {
    const html = segmentPopupHtml(clean);
    expect(html).toContain('Calle 16');
    expect(html).toContain('Doble sentido');
    expect(html).toContain('Sin baches');
    expect(html).toContain('×1');
  });

  it('shows long streets in kilometers', () => {
    expect(segmentPopupHtml(longStreet)).toContain('1,3 km');
  });

  it('cannot be used to inject markup through the street name', () => {
    const html = segmentPopupHtml({ ...clean, name: '<img src=x onerror=alert(1)>' });
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('replaces an unsafe color from the API', () => {
    const html = segmentPopupHtml({ ...clean, color: 'red;background:url(x)' });
    expect(html).not.toContain('url(x)');
    expect(html).toContain('#9ca3af');
  });
});

describe('potholePopupHtml', () => {
  it('shows severity, status, confidence, detections and dates', () => {
    const html = potholePopupHtml(confirmed);
    expect(html).toContain('Bache grave');
    expect(html).toContain('Confirmado');
    expect(html).toContain('87,5 %');
    expect(html).toContain('Detecciones');
    expect(html).toContain('Primera vez');
    expect(html).toContain('Última vez');
    expect(html).toContain('2026');
  });

  it('shows "Calle sin nombre" when the street has no name', () => {
    expect(potholePopupHtml(confirmed)).toContain('Calle sin nombre');
  });

  it('shows the street name when there is one', () => {
    expect(potholePopupHtml({ ...confirmed, roadName: 'Carrera 24' })).toContain('Carrera 24');
  });
});
