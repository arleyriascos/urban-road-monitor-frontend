import { describe, expect, it } from 'vitest';
import { ApiError } from '../api/http';
import { describeRouteError, retryAfterSeconds } from './route-errors';

const http = (status: number, code?: string, details?: Record<string, unknown>) =>
  new ApiError('http', 'x', status, code, details);

describe('describeRouteError', () => {
  it('explains a slow server and a lost connection', () => {
    expect(describeRouteError(new ApiError('timeout', 'x')).title).toBe(
      'El servidor no respondió a tiempo',
    );
    expect(describeRouteError(new ApiError('network', 'x')).title).toBe(
      'No se pudo conectar con el servidor',
    );
  });

  it('explains that one-way streets leave no way through', () => {
    const description = describeRouteError(http(404, 'NO_ROUTE'));
    expect(description.title).toBe('No hay un camino entre estos puntos');
    expect(description.point).toBeUndefined();
  });

  it('says which point is too far, how far, and marks it', () => {
    const description = describeRouteError(
      http(422, 'OUTSIDE_NETWORK', { point: 'destination', distanceM: 450.2, maxDistanceM: 200 }),
    );
    expect(description).toEqual({
      title: 'El destino quedó lejos de las calles',
      help: 'Está a 450 m de la calle más cercana y el máximo es 200 m. Muévelo más cerca de una calle.',
      point: 'destination',
    });
  });

  it('still explains a far point when the details are missing', () => {
    const description = describeRouteError(http(422, 'OUTSIDE_NETWORK'));
    expect(description.title).toBe('Un punto quedó lejos de las calles');
    expect(description.help).toBe('Muévelo más cerca de una calle.');
  });

  it('asks to wait as long as the backend says after too many requests', () => {
    const description = describeRouteError(http(429, 'TOO_MANY_REQUESTS', { retryAfterS: 42 }));
    expect(description.title).toBe('Demasiadas rutas seguidas');
    expect(description.waitS).toBe(42);
  });

  it('offers the wake-up link when the sleeping route service did not wake in time', () => {
    const description = describeRouteError(
      http(503, 'ROUTE_SERVICE_UNAVAILABLE', { retryable: true, retryAfterS: 30 }),
    );
    expect(description.title).toBe('El servicio de rutas no despertó a tiempo');
    expect(description.wakeLink).toBe(true);
  });

  it('does not offer the link for other route service failures', () => {
    const description = describeRouteError(
      http(503, 'ROUTE_SERVICE_UNAVAILABLE', { retryable: true }),
    );
    expect(description.title).toBe('El servicio de rutas no está disponible');
    expect(description.wakeLink).toBeUndefined();
  });

  it.each([
    [http(503, 'DATABASE_UNAVAILABLE'), 'La base de datos no está disponible'],
    [http(400, 'INVALID_REQUEST'), 'La app pidió la ruta con datos inválidos'],
    [http(500, 'INTERNAL_ERROR'), 'El servidor respondió con un error (código 500)'],
  ])('explains other answers (%#)', (error, title) => {
    expect(describeRouteError(error).title).toBe(title);
  });
});

describe('retryAfterSeconds', () => {
  it('reads a number and ignores anything else', () => {
    expect(retryAfterSeconds(http(503, 'X', { retryAfterS: 30 }))).toBe(30);
    expect(retryAfterSeconds(http(503, 'X', { retryAfterS: '30' }))).toBeUndefined();
    expect(retryAfterSeconds(http(503, 'X'))).toBeUndefined();
  });
});
