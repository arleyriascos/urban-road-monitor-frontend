import { describe, expect, it } from 'vitest';
import { describeCameraError } from './camera-error';

describe('describeCameraError', () => {
  it.each([
    ['NotAllowedError', 'denied'],
    ['PermissionDeniedError', 'denied'],
    ['NotFoundError', 'not_found'],
    ['OverconstrainedError', 'not_found'],
    ['NotReadableError', 'busy'],
    ['AbortError', 'busy'],
    ['NotSupportedError', 'unsupported'],
    ['SecurityError', 'insecure'],
    ['SomethingElse', 'other'],
  ])('%s is %s', (name, kind) => {
    expect(describeCameraError(new DOMException('x', name)).kind).toBe(kind);
  });

  it('gives a message in Spanish for every kind', () => {
    const names = [
      'NotAllowedError',
      'NotFoundError',
      'NotReadableError',
      'NotSupportedError',
      'SecurityError',
      'Other',
    ];
    for (const name of names) {
      expect(describeCameraError(new DOMException('x', name)).message).toMatch(/cámara|navegador/);
    }
  });

  it('tells the person how to fix a denied permission', () => {
    expect(describeCameraError(new DOMException('x', 'NotAllowedError')).message).toMatch(
      /ajustes/,
    );
  });

  it('handles values that are not errors', () => {
    expect(describeCameraError('boom').kind).toBe('other');
    expect(describeCameraError(null).kind).toBe('other');
  });
});
