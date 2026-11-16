import { describe, expect, it } from 'vitest';
import { SEVERITY_LIMITS, severityOf } from './severity';

describe('severityOf', () => {
  it('calls a small box leve', () => {
    expect(severityOf(0)).toBe('leve');
    expect(severityOf(0.005)).toBe('leve');
  });

  it('calls a medium box moderado', () => {
    expect(severityOf(0.02)).toBe('moderado');
  });

  it('calls a big box grave', () => {
    expect(severityOf(0.1)).toBe('grave');
    expect(severityOf(1)).toBe('grave');
  });

  it('starts the next severity exactly at each limit', () => {
    expect(severityOf(SEVERITY_LIMITS.leve - 1e-9)).toBe('leve');
    expect(severityOf(SEVERITY_LIMITS.leve)).toBe('moderado');
    expect(severityOf(SEVERITY_LIMITS.moderado - 1e-9)).toBe('moderado');
    expect(severityOf(SEVERITY_LIMITS.moderado)).toBe('grave');
  });

  it('keeps the limits in order', () => {
    expect(SEVERITY_LIMITS.leve).toBeLessThan(SEVERITY_LIMITS.moderado);
  });
});
