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

describe('segmentSummaryHtml', () => {
  it('says where the segment is in its street', () => {
    expect(segmentSummaryHtml(ANSWER)).toContain('Tramo 4 de 12 de esta calle');
  });

  it('adds up the stretch around the segment', () => {
    const html = segmentSummaryHtml(ANSWER);
    expect(html).toContain('Alrededor (5 tramos)');
    expect(html).toContain('403 m');
    expect(html).toContain('Baches a la vista');
    expect(html).toContain('Baches confirmados');
    expect(html).toContain('3,3');
    expect(html).toContain('Grave');
  });

  it('adds up the whole street, and says no pothole is confirmed when none is', () => {
    const html = segmentSummaryHtml(ANSWER);
    expect(html).toContain('Calle 18, completa');
    expect(html).toContain('1,5 km');
    expect(html).toContain('Ninguna confirmada');
  });

  it('writes "1 tramo" in the singular', () => {
    const one = { ...ANSWER, window: { ...ANSWER.window, summary: { ...SUMMARY, segments: 1 } } };
    expect(segmentSummaryHtml(one)).toContain('Alrededor (1 tramo)');
  });

  it('names a street without a name and cannot inject markup', () => {
    const unnamed = { ...ANSWER, road: { ...ANSWER.road, roadName: null } };
    expect(segmentSummaryHtml(unnamed)).toContain('Calle sin nombre, completa');
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
