import { describe, expect, it } from 'vitest';
import { potholesFixture, segmentsFixture } from '../test/fixtures';
import type { SegmentSummaryAnswer } from '../types/roads';
import {
  potholePopupHtml,
  segmentPopupHtml,
  segmentSummaryHtml,
  summaryErrorHtml,
  summaryLoadingHtml,
} from './popups';

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

  it('explains what each status means for the damage and the routes', () => {
    expect(potholePopupHtml(confirmed)).toContain('al menos dos veces');
    expect(potholePopupHtml({ ...confirmed, status: 'sin confirmar' })).toContain(
      'no cambia el daño de la calle ni las rutas',
    );
    expect(potholePopupHtml({ ...confirmed, status: 'reparado' })).toContain('Ya fue reparado');
  });

  it('shows "Calle sin nombre" when the street has no name', () => {
    expect(potholePopupHtml(confirmed)).toContain('Calle sin nombre');
  });

  it('shows the street name when there is one', () => {
    expect(potholePopupHtml({ ...confirmed, roadName: 'Carrera 24' })).toContain('Carrera 24');
  });
});

const SUMMARY = {
  segments: 5,
  lengthM: 402.5,
  visiblePotholes: 3,
  confirmedPotholes: 2,
  damageScore: 3.25,
  worstSeverity: { name: 'grave', weight: 6 },
};

const ANSWER: SegmentSummaryAnswer = {
  segment: { id: 7, roadId: 3, roadName: 'Calle 18', position: 4, segmentsInRoad: 12 },
  radius: 2,
  window: {
    roadId: 3,
    roadName: 'Calle 18',
    fromSegmentIndex: 1,
    toSegmentIndex: 5,
    summary: SUMMARY,
  },
  road: {
    roadId: 3,
    roadName: 'Calle 18',
    fromSegmentIndex: 0,
    toSegmentIndex: 11,
    summary: {
      segments: 12,
      lengthM: 1530,
      visiblePotholes: 0,
      confirmedPotholes: 0,
      damageScore: 0,
      worstSeverity: null,
    },
  },
};

describe('segmentPopupHtml with extra content', () => {
  it('puts the extra content inside the popup, after the facts', () => {
    const html = segmentPopupHtml(severe, '<p class="popup__note">hola</p>');
    expect(html.endsWith('<p class="popup__note">hola</p></div>')).toBe(true);
    expect(html.indexOf('Costo de ruta')).toBeLessThan(html.indexOf('hola'));
  });
});

describe('segmentSummaryHtml', () => {
  it('says where the segment is in its street', () => {
    expect(segmentSummaryHtml(ANSWER)).toContain('Tramo 4 de 12 de Calle 18');
  });

  it('compares the stretch around the segment with the whole street in one table', () => {
    const html = segmentSummaryHtml(ANSWER);
    expect(html).toContain('<th scope="col">Alrededor</th>');
    expect(html).toContain('<th scope="col">Toda la calle</th>');
    expect(html).toContain('<th scope="row">Tramos</th><td>5</td><td>12</td>');
    expect(html).toContain('<th scope="row">Longitud</th><td>403 m</td><td>1,5 km</td>');
    expect(html).toContain('<th scope="row">Baches a la vista</th><td>3</td><td>0</td>');
    expect(html).toContain('<th scope="row">Confirmados</th><td>2</td><td>0</td>');
    expect(html).toContain('<th scope="row">Daño</th><td>3,3</td><td>0,0</td>');
  });

  it('names the worst severity, or says none when no pothole is confirmed', () => {
    expect(segmentSummaryHtml(ANSWER)).toContain(
      '<th scope="row">Peor gravedad</th><td>Grave</td><td>Ninguna</td>',
    );
  });

  it('names a street without a name and cannot inject markup', () => {
    const unnamed = { ...ANSWER, road: { ...ANSWER.road, roadName: null } };
    expect(segmentSummaryHtml(unnamed)).toContain('de Calle sin nombre');
    const hostile = { ...ANSWER, road: { ...ANSWER.road, roadName: '<b onmouseover=x>' } };
    expect(segmentSummaryHtml(hostile)).not.toContain('<b ');
  });
});

describe('the states of the summary', () => {
  it('tells it is loading, as a status', () => {
    expect(summaryLoadingHtml()).toContain('role="status"');
    expect(summaryLoadingHtml()).toContain('Cargando');
  });

  it('tells it failed and how to try again', () => {
    expect(summaryErrorHtml()).toContain('No se pudo cargar');
    expect(summaryErrorHtml()).toContain('otra vez');
  });
});
