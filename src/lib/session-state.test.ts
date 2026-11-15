import { describe, expect, it } from 'vitest';
import { ApiError } from '../api/http';
import {
  initialSessionState,
  sessionReducer,
  type SessionAction,
  type SessionState,
} from './session-state';

const TOKEN = 'a'.repeat(43);
const user = {
  id: 'u1',
  email: 'ana@example.com',
  fullName: 'Ana',
  avatarUrl: null,
  roles: ['usuario'],
};
const down = new ApiError('timeout', 'slow');

const entry: SessionState = { status: 'entry', signIn: { phase: 'idle' } };
const checking: SessionState = { status: 'checking', token: TOKEN, attempt: 0, unreachable: null };
const guest: SessionState = { status: 'guest', remembered: true };
const signedIn: SessionState = { status: 'signed_in', token: TOKEN, user };

const run = (state: SessionState, ...actions: SessionAction[]) =>
  actions.reduce(sessionReducer, state);

describe('initialSessionState', () => {
  it('starts checking when there is a saved identifier, even if the guest choice is saved too', () => {
    expect(initialSessionState({ token: TOKEN, guest: true })).toEqual(checking);
  });

  it('starts as a remembered guest', () => {
    expect(initialSessionState({ token: null, guest: true })).toEqual(guest);
  });

  it('starts at the entry when nothing is saved', () => {
    expect(initialSessionState({ token: null, guest: false })).toEqual(entry);
  });
});

describe('checking a saved session', () => {
  it('signs the person in when the backend knows the session', () => {
    expect(run(checking, { type: 'check_answered', user })).toEqual(signedIn);
  });

  it('goes back to the entry when the session is gone', () => {
    expect(run(checking, { type: 'check_session_gone' })).toEqual(entry);
  });

  it('keeps checking, with the error, when the server could not answer', () => {
    const next = run(checking, { type: 'check_unreachable', error: down });
    expect(next).toEqual({ ...checking, unreachable: down });
  });

  it('counts a new try and forgets the last error', () => {
    const next = run(
      checking,
      { type: 'check_unreachable', error: down },
      { type: 'check_retry' },
      { type: 'check_retry' },
    );
    expect(next).toEqual({ ...checking, attempt: 2, unreachable: null });
  });

  it('lets the person go on as a guest for now, without remembering it', () => {
    expect(run(checking, { type: 'check_skipped' })).toEqual({
      status: 'guest',
      remembered: false,
    });
  });
});

describe('signing in from the entry', () => {
  it('goes through working to signed in', () => {
    const working = run(entry, { type: 'sign_in_started' });
    expect(working).toEqual({ status: 'entry', signIn: { phase: 'working' } });
    expect(run(working, { type: 'signed_in', token: TOKEN, user })).toEqual(signedIn);
  });

  it('keeps the error to show it, and lets the person try again', () => {
    const failed = run(entry, { type: 'sign_in_started' }, { type: 'sign_in_failed', error: down });
    expect(failed).toEqual({ status: 'entry', signIn: { phase: 'failed', error: down } });
    expect(run(failed, { type: 'sign_in_started' })).toEqual({
      status: 'entry',
      signIn: { phase: 'working' },
    });
  });

  it('chooses to be a guest', () => {
    expect(run(entry, { type: 'guest_chosen' })).toEqual(guest);
  });
});

describe('leaving', () => {
  it('signs out to the entry', () => {
    expect(run(signedIn, { type: 'signed_out' })).toEqual(entry);
  });

  it('lets a guest go to the entry to sign in', () => {
    expect(run(guest, { type: 'sign_in_requested' })).toEqual(entry);
  });
});

describe('an action that does not fit the state changes nothing', () => {
  const stray: Array<[SessionState, SessionAction]> = [
    [entry, { type: 'check_answered', user }],
    [guest, { type: 'check_session_gone' }],
    [signedIn, { type: 'check_unreachable', error: down }],
    [signedIn, { type: 'check_retry' }],
    [entry, { type: 'check_skipped' }],
    [signedIn, { type: 'guest_chosen' }],
    [signedIn, { type: 'sign_in_requested' }],
    [checking, { type: 'sign_in_started' }],
    [entry, { type: 'sign_in_failed', error: down }],
    [guest, { type: 'signed_in', token: TOKEN, user }],
    [entry, { type: 'signed_out' }],
    [guest, { type: 'signed_out' }],
  ];

  it.each(stray)('%j ignores %j', (state, action) => {
    expect(sessionReducer(state, action)).toBe(state);
  });
});
