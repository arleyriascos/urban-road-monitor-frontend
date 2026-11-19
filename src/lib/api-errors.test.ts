import { describe, expect, it } from 'vitest';
import { englishTexts } from '../test/english';
import { describeError } from './api-errors';

describe('describeError', () => {
  it('explains that the server may be waking up after a timeout', () => {
    const { title, help } = describeError({ kind: 'timeout' });
    expect(title).toBe('El servidor no respondió a tiempo');
    expect(help).toContain('despertando');
  });

  it('asks to check the connection when the server cannot be reached', () => {
    const { title, help } = describeError({ kind: 'network' });
    expect(title).toBe('No se pudo conectar con el servidor');
    expect(help).toContain('conexión');
  });

  it('tells apart a database that is not available (503)', () => {
    const { title } = describeError({ kind: 'http', status: 503 });
    expect(title).toContain('la base de datos no está disponible');
  });

  it('shows the status code of any other error', () => {
    expect(describeError({ kind: 'http', status: 500 }).title).toContain('código 500');
  });

  it('says "desconocido" when there is no status code', () => {
    expect(describeError({ kind: 'http' }).title).toContain('desconocido');
  });
});

describe('describeError in English', () => {
  const english = englishTexts.t;

  it('explains each kind of failure in English', () => {
    expect(describeError({ kind: 'timeout' }, english).title).toBe(
      'The server did not answer in time',
    );
    expect(describeError({ kind: 'network' }, english).title).toBe(
      'Could not connect to the server',
    );
    expect(describeError({ kind: 'http', status: 503 }, english).title).toContain(
      'the database is not available',
    );
  });

  it('names the code of any other error, or says it is unknown', () => {
    expect(describeError({ kind: 'http', status: 500 }, english).title).toBe(
      'The server answered with an error (code 500)',
    );
    expect(describeError({ kind: 'http' }, english).title).toContain('(code unknown)');
  });
});
