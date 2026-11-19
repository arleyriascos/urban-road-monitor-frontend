import { describe, expect, it } from 'vitest';
import { englishTexts } from '../test/english';
import { accessOf, describeAccess, RECORD_PERMISSION, type SendAccess } from './access';

describe('accessOf', () => {
  it('lets an account with the permission record', () => {
    expect(accessOf({ id: 'u1', permissions: ['map.view', RECORD_PERMISSION] }, 'tok')).toEqual({
      status: 'allowed',
      token: 'tok',
      userId: 'u1',
    });
  });

  it('does not let an account without it', () => {
    expect(accessOf({ id: 'u1', permissions: ['map.view'] }, 'tok')).toEqual({
      status: 'no_permission',
    });
  });
});

describe('describeAccess', () => {
  it('has a different sentence for each state', () => {
    const states: SendAccess[] = [
      { status: 'guest' },
      { status: 'checking' },
      { status: 'allowed', token: 't', userId: 'u' },
      { status: 'no_permission' },
      { status: 'session_over' },
      { status: 'unreachable' },
    ];
    const texts = states.map((state) => describeAccess(state));
    expect(new Set(texts).size).toBe(states.length);
  });

  it('asks a guest to sign in with Google', () => {
    expect(describeAccess({ status: 'guest' })).toMatch(/Ingresa con tu cuenta de Google/);
  });

  it('does not ask for the role of collaborator any more', () => {
    expect(describeAccess({ status: 'no_permission' })).not.toMatch(/colaborador/);
  });
});

describe('describeAccess in English', () => {
  it('says something different in English for each state', () => {
    const states: SendAccess[] = [
      { status: 'guest' },
      { status: 'checking' },
      { status: 'allowed', token: 't', userId: 'u' },
      { status: 'no_permission' },
      { status: 'session_over' },
      { status: 'unreachable' },
    ];
    const texts = states.map((state) => describeAccess(state, englishTexts.t));
    expect(new Set(texts).size).toBe(states.length);
    expect(texts[0]).toMatch(/Sign in with your Google account/);
    expect(texts[2]).toMatch(/saved and sent under your name/);
  });
});
