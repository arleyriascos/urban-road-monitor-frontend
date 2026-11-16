import { describe, expect, it } from 'vitest';
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
    const texts = states.map(describeAccess);
    expect(new Set(texts).size).toBe(states.length);
  });

  it('tells a guest that nothing is saved', () => {
    expect(describeAccess({ status: 'guest' })).toMatch(/no se guardan/);
  });
});
