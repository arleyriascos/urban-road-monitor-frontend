import { describe, expect, it } from 'vitest';
import type { GeolocationState } from '../hooks/useGeolocation';
import type { SendingView } from '../hooks/useDetectionSending';
import type { SendAccess } from './access';
import { englishTexts } from '../test/english';
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

describe('summarizeSending in English', () => {
  it('asks a guest to sign in, in English', () => {
    const summary = summarizeSending(
      { status: 'guest' },
      { status: 'off' },
      view(),
      true,
      englishTexts,
    );
    expect(summary.messages[0].text).toBe(
      'Sign in with your Google account to detect and save potholes.',
    );
  });

  it('says in English that the phone is being located and what the GPS problem is', () => {
    const waiting = summarizeSending(ALLOWED, { status: 'waiting' }, view(), true, englishTexts);
    expect(waiting.messages.map((m) => m.text)).toContain('Looking for the location of the phone…');
    const denied = summarizeSending(
      ALLOWED,
      { status: 'problem', problem: 'denied' },
      view(),
      true,
      englishTexts,
    );
    expect(denied.messages[1].text).toMatch(/no permission to use the location/);
  });

  it('counts the waiting potholes in singular and plural', () => {
    const one = summarizeSending(
      ALLOWED,
      READY,
      view({ status: 'waiting', pending: 1 }),
      true,
      englishTexts,
    );
    expect(one.messages[1].text).toBe(
      'Could not send for now. 1 pothole is waiting on your phone and will be sent on its own when the connection returns.',
    );
    const many = summarizeSending(
      ALLOWED,
      READY,
      view({ status: 'waiting', pending: 1250 }),
      true,
      englishTexts,
    );
    expect(many.messages[1].text).toContain('1,250 potholes are waiting');
  });

  it('tells what to do when the session ended, the account cannot save or the model is old', () => {
    const text = (patch: Partial<SendingView>) =>
      summarizeSending(ALLOWED, READY, view(patch), true, englishTexts).messages[1].text;
    expect(text({ status: 'session_over', pending: 3 })).toContain('3 potholes are kept');
    expect(text({ status: 'not_allowed' })).toContain('cannot save potholes now');
    expect(text({ status: 'model_outdated' })).toContain('There is a newer model');
  });

  it('counts what is pending to send when the camera is off', () => {
    const summary = summarizeSending(ALLOWED, READY, view({ pending: 2 }), false, englishTexts);
    expect(summary.messages[1].text).toBe('2 potholes waiting to be sent.');
  });
});
