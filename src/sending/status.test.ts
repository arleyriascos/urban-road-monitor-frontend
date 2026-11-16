import { describe, expect, it } from 'vitest';
import type { GeolocationState } from '../hooks/useGeolocation';
import type { SendingView } from '../hooks/useDetectionSending';
import type { SendAccess } from './access';
import { summarizeSending } from './status';

const ALLOWED: SendAccess = { status: 'allowed', token: 't', userId: 'u' };
const READY: GeolocationState = {
  status: 'ready',
  fix: { latitude: 1, longitude: 1, accuracyM: 5, timestamp: 0 },
};
const view = (patch: Partial<SendingView> = {}): SendingView => ({
  recording: true,
  pending: 0,
  stored: 0,
  discarded: 0,
  status: 'idle',
  ...patch,
});

describe('summarizeSending', () => {
  it('asks a guest to sign in and shows no counts', () => {
    const summary = summarizeSending({ status: 'guest' }, { status: 'off' }, view(), true);
    expect(summary.messages).toHaveLength(1);
    expect(summary.messages[0].text).toMatch(/Ingresa con tu cuenta/);
    expect(summary.counts).toBeNull();
  });

  it('tells a signed-in person that what they see is saved', () => {
    const summary = summarizeSending(ALLOWED, READY, view(), true);
    expect(summary.messages.map((m) => m.tone)).toEqual(['info']);
    expect(summary.messages[0].text).toMatch(/se guardan y se envían/);
    expect(summary.counts).toBeNull();
  });

  it('counts what was stored and what waits', () => {
    const summary = summarizeSending(ALLOWED, READY, view({ stored: 4, pending: 2 }), true);
    expect(summary.counts).toEqual({ stored: 4, pending: 2 });
  });

  it('warns about the GPS only while the camera is on', () => {
    const problem: GeolocationState = { status: 'problem', problem: 'denied' };
    expect(summarizeSending(ALLOWED, problem, view(), true).messages[1]).toMatchObject({
      tone: 'warning',
      text: expect.stringMatching(/permiso/),
    });
    expect(summarizeSending(ALLOWED, problem, view(), false).messages).toHaveLength(1);
    expect(summarizeSending(ALLOWED, { status: 'waiting' }, view(), true).messages[1].text).toMatch(
      /ubicación/,
    );
  });

  it('explains a failed sending and says the detections are safe', () => {
    const waiting = summarizeSending(ALLOWED, READY, view({ status: 'waiting', pending: 3 }), true);
    expect(waiting.messages[1].tone).toBe('warning');
    expect(waiting.messages[1].text).toMatch(/3 baches esperan/);

    const one = summarizeSending(ALLOWED, READY, view({ status: 'waiting', pending: 1 }), true);
    expect(one.messages[1].text).toMatch(/1 bache espera .* se enviará solo/);
  });

  it('explains each reason for which sending stopped', () => {
    const texts = (['session_over', 'not_allowed', 'model_outdated'] as const).map(
      (status) =>
        summarizeSending(ALLOWED, READY, view({ status, pending: 2 }), true).messages[1].text,
    );
    expect(new Set(texts).size).toBe(3);
    expect(texts[0]).toMatch(/sesión terminó/);
    expect(texts[2]).toMatch(/Recarga/);
  });

  it('reminds of what is pending when the camera is off', () => {
    const summary = summarizeSending(ALLOWED, { status: 'off' }, view({ pending: 5 }), false);
    expect(summary.messages[1].text).toBe('5 baches pendientes de enviar.');
    expect(
      summarizeSending(ALLOWED, { status: 'off' }, view({ pending: 0 }), false).messages,
    ).toHaveLength(1);
  });
});
