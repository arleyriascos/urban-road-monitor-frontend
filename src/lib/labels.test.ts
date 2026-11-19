import { describe, expect, it } from 'vitest';
import { englishTexts } from '../test/english';
import { roadTypeLabel, severityLabel, statusLabel } from './labels';

describe('severityLabel', () => {
  it('writes each severity in the language of the app', () => {
    expect(severityLabel('sin baches')).toBe('Sin baches');
    expect(severityLabel('grave')).toBe('Grave');
    expect(severityLabel('sin baches', englishTexts)).toBe('No potholes');
    expect(severityLabel('leve', englishTexts)).toBe('Mild');
    expect(severityLabel('moderado', englishTexts)).toBe('Moderate');
    expect(severityLabel('grave', englishTexts)).toBe('Severe');
  });

  it('shows a severity it does not know with a capital, as it came', () => {
    expect(severityLabel('crítico', englishTexts)).toBe('Crítico');
  });

  it('does not take the name of a property of Object for a severity', () => {
    expect(severityLabel('constructor', englishTexts)).toBe('Constructor');
  });
});

describe('statusLabel', () => {
  it('writes each state of a pothole in the language of the app', () => {
    expect(statusLabel('sin confirmar')).toBe('Sin confirmar');
    expect(statusLabel('confirmado', englishTexts)).toBe('Confirmed');
    expect(statusLabel('reparado', englishTexts)).toBe('Repaired');
    expect(statusLabel('sin confirmar', englishTexts)).toBe('Unconfirmed');
  });
});

describe('roadTypeLabel', () => {
  it('writes each type of road in the language of the app', () => {
    expect(roadTypeLabel('Calle residencial')).toBe('Calle residencial');
    expect(roadTypeLabel('Calle residencial', englishTexts)).toBe('Residential street');
    expect(roadTypeLabel('Vía de servicio', englishTexts)).toBe('Service road');
  });

  it('keeps a type it does not know as it came', () => {
    expect(roadTypeLabel('Sendero', englishTexts)).toBe('Sendero');
    expect(roadTypeLabel('toString', englishTexts)).toBe('toString');
  });
});
