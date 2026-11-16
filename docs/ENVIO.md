# Envío de detecciones (Etapa 4, paquete 6)

Cuando la persona ingresó con su cuenta y la cámara está encendida, cada bache que ve el modelo se guarda con la ubicación del teléfono y se envía al backend. Un **invitado** no puede abrir la cámara: no hay cuenta a cuyo nombre guardar. El backend y sus reglas están explicados en `docs/API-VIAJES.md` del repositorio del backend.

## Quién puede enviar

La pantalla `/camara` lee la sesión guardada. Sin sesión muestra una pantalla que pide ingresar con Google (y no pide la cámara, el modelo ni la ubicación). Con sesión, pregunta al backend quién es (`GET /api/auth/me`) y envía solo si tiene el permiso `detections.create`, que desde la migración 11 del backend tiene todo rol, desde `usuario`.

| Situación               | Qué pasa                                                             |
| ----------------------- | -------------------------------------------------------------------- |
| Sin sesión (invitado)   | No se abre la cámara: la pantalla pide ingresar con Google.          |
| Cuenta sin el permiso   | Se ven los recuadros, no se guarda nada y se pide revisar la cuenta. |
| Sesión terminada (401)  | No se guarda; la pantalla pide ingresar de nuevo desde el mapa.      |
| El servidor no contesta | Se vuelve a preguntar cada 10 segundos; mientras tanto no se guarda. |
| Cuenta con el permiso   | Se guardan los baches y se envían (también el rol `usuario`).        |

## Qué se guarda de cada bache

Una detección se guarda solo si el servidor no la va a rechazar: confianza del modelo de 0,40 o más, precisión del GPS de 20 m o mejor, y una caja con área. Lleva:

- `id`: un UUID hecho en el teléfono. Mandar la misma detección otra vez no la duplica.
- `latitude`, `longitude`, `gpsAccuracyM`: la posición **del teléfono** (la cámara mira la calle justo adelante).
- `confidence` y `bboxAreaRatio`: la confianza y la parte de la imagen que cubre la caja. **La gravedad no se manda**: la calcula el servidor.
- `detectedAt`: la hora, en formato ISO.

Como el mismo bache aparece en muchos cuadros seguidos, solo se guarda una detección por lugar: si ya se guardó otra a menos de 6 m en los últimos 8 segundos, se descarta (`src/sending/candidate.ts`).

Nunca sale una imagen: el análisis se hace en el teléfono.

## La cola del navegador

Las detecciones esperan en una cola que se copia a `localStorage` en cada cambio (`src/sending/queue.ts`), así que cerrar la página, perder la señal o quedarse sin batería no pierde nada.

- Guarda **hasta 500**. Si se llena, se descartan las más viejas.
- Pertenece a **una cuenta**: si entra otra cuenta en el mismo navegador, no manda las detecciones de la anterior.
- Al abrir `/camara` con la misma cuenta, lo que quedó pendiente se envía solo.
- Si el navegador no deja usar `localStorage` (ventana privada), la cola funciona solo en memoria.

## El viaje y los lotes

Un **viaje** es una salida con la cámara encendida (`src/sending/sender.ts`):

1. El viaje se abre al mandar el primer lote (`POST /api/trips`) con el sistema y el navegador del teléfono y la versión del modelo (`MODEL_VERSION` en `src/detection/model-info.ts`, que debe ser la que el servidor tiene activa). Empieza cuando se encendió la cámara.
2. Las detecciones salen en **lotes de hasta 100** (`POST /api/trips/:id/detections`). Lo que el servidor guardó, repitió o rechazó se saca de la cola: mandarlo otra vez daría lo mismo.
3. Al apagar la cámara se envía lo que quede y el viaje se cierra con los cuadros analizados y la distancia recorrida (`PATCH /api/trips/:id`). Si quedan detecciones sin enviar, el viaje queda abierto: el servidor las acepta hasta 24 horas después.

La distancia se suma con los puntos del GPS, ignorando los saltos de menos de 3 m (ruido con el teléfono quieto) y los puntos con error de más de 30 m.

## Cuando algo falla

| Respuesta                                | Qué hace la app                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| Sin conexión, tiempo agotado, 5xx, 503   | Conserva la cola y reintenta a los 5, 10, 20, 40 y 60 segundos (luego cada 60). |
| 429                                      | Espera lo que pide el servidor (`retryAfterS`), nunca menos que la pausa usual. |
| 409 `TRIP_CLOSED` o 404 `TRIP_NOT_FOUND` | Abre otro viaje y manda las mismas detecciones (una sola vez seguida).          |
| 401                                      | Se detiene y conserva la cola; pide ingresar de nuevo.                          |
| 403                                      | Se detiene y conserva la cola.                                                  |
| 409 `MODEL_VERSION_MISMATCH`             | Se detiene y pide recargar la página para tener el modelo más nuevo.            |
| 400                                      | Descarta ese lote: reintentarlo fallaría para siempre.                          |

Un 503 **nunca** cierra la sesión. Cuando vuelve la conexión (`online`) o la página se muestra otra vez, se reintenta de inmediato sin esperar la pausa. Cada vez que el servidor guarda detecciones, el navegador despierta el servicio de IA (`wakeAiService`), que agrupa los baches en el servidor.

## Cómo probar

1. Entrar con cualquier cuenta de Google (no hace falta ser colaborador) y abrir `/camara` (en `localhost`, o en Vercel desde un teléfono).
2. Encender la cámara y permitir la ubicación. La pantalla dice «Los baches que veas se guardan y se envían a tu nombre».
3. Para ver la cola: apagar la conexión en las herramientas del navegador, pasar frente a un bache y ver «En espera»; al volver la conexión pasa a «Enviados».
4. Después de probar en la calle, borrar los viajes de prueba en el backend con `npm run trips:cleanup`.
