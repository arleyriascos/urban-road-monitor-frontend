import { describe, expect, it } from 'vitest';
import { getStopStatuses, STOPS } from './connection-stops';

describe('STOPS', () => {
  it('are the three places a request goes through', () => {
    expect(STOPS.map((stop) => stop.name)).toEqual(['Tu navegador', 'Servidor', 'Base de datos']);
  });
});

describe('getStopStatuses', () => {
  it('reaches every stop when the request succeeded', () => {
    expect(getStopStatuses({ status: 'success' })).toEqual(['reached', 'reached', 'reached']);
  });

  it('is waiting for the server and the database while loading', () => {
    expect(getStopStatuses({ status: 'loading' })).toEqual(['reached', 'pending', 'pending']);
  });

  it('fails at the server when it cannot be reached', () => {
    expect(getStopStatuses({ status: 'error', error: { kind: 'network' } })).toEqual([
      'reached',
      'failed',
      'pending',
    ]);
    expect(getStopStatuses({ status: 'error', error: { kind: 'timeout' } })).toEqual([
      'reached',
      'failed',
      'pending',
    ]);
  });

  it('fails at the database when the server answers 503', () => {
    expect(getStopStatuses({ status: 'error', error: { kind: 'http', status: 503 } })).toEqual([
      'reached',
      'reached',
      'failed',
    ]);
  });

  it('fails at the server for any other error answer', () => {
    expect(getStopStatuses({ status: 'error', error: { kind: 'http', status: 500 } })).toEqual([
      'reached',
      'failed',
      'pending',
    ]);
  });
});
