# API de rutas: contrato con el backend

Resumen de `POST /api/routes` del backend (su documentación completa está en Swagger, `/api/docs`, sección "Routes", y en la sección "Rutas (para el frontend)" del README del backend). En este repositorio, los tipos están en `src/types/route.ts`, la llamada en `src/api/routes.ts` y los mensajes de error en `src/lib/route-errors.ts`.

## Petición

```json
{
  "origin": { "latitude": 1.2136, "longitude": -77.2811 },
  "destination": { "latitude": 1.215, "longitude": -77.279 },
  "criterion": "balanced"
}
```

- **`criterion`:** `shortest` (la más corta, sin mirar los baches), `balanced` (por defecto) o `avoid_potholes`. Internamente es el factor `k` = 0, 1 o 3 del costo `longitud × (1 + k × daño)`.
- **`algorithm`** (opcional): `astar` (por defecto) o `dijkstra`. Dan la misma ruta; Dijkstra explora más nodos.

El backend redondea los clics a 4 decimales (unos 11 m), ajusta cada uno a la esquina más cercana y guarda las rutas en una caché LRU.

## Respuesta

`criterion`, `algorithm`, `fromCache` (si salió de la caché), `origin` y `destination` (la esquina a la que se ajustó cada clic y a cuántos metros quedó), `summary` (`lengthM`, `cost`, `steps`, `exploredNodes`, `computationMs`) y `route`: un GeoJSON `FeatureCollection` con **una línea por tramo, en orden de viaje y con el trazado ya en el sentido del recorrido**. Cada tramo trae en `properties` su `order`, `segmentId`, `roadName`, `reversed`, `lengthM`, `damageScore` y `cost`.

## Errores

| Estado | Código                      | Qué muestra la app                                                                        |
| ------ | --------------------------- | ----------------------------------------------------------------------------------------- |
| 400    | `INVALID_REQUEST`           | Que la app pidió la ruta con datos inválidos                                              |
| 404    | `NO_ROUTE`                  | Que no hay camino respetando el sentido de las calles                                     |
| 422    | `OUTSIDE_NETWORK`           | Qué punto (`details.point`) quedó lejos y a cuántos metros; ese marcador se resalta       |
| 429    | `TOO_MANY_REQUESTS`         | Que espere `details.retryAfterS` segundos; el botón Reintentar cuenta hacia atrás         |
| 503    | `ROUTE_SERVICE_UNAVAILABLE` | Con `details.retryAfterS`: el servicio de IA duerme; la app lo despierta y reintenta sola |
| 503    | `DATABASE_UNAVAILABLE`      | Que la base no está disponible y que reintente                                            |

Con el 503 que trae `retryAfterS`, la app despierta el servicio de IA desde el navegador, espera esos segundos y vuelve a pedir la ruta, hasta 4 intentos. Si no alcanza, muestra el error con un enlace que abre `VITE_AI_SERVICE_URL/health` en otra pestaña.
