# Cuenta y sesión en el frontend

Cómo ingresa una persona, cómo se recuerda y qué pasa cuando algo falla. El backend (`docs/AUTENTICACION.md` de su repositorio) decide quién es cada quien; el frontend solo lo muestra.

## Qué ve la persona

1. **Sin sesión ni elección guardada:** pantalla de entrada con las pestañas «Iniciar sesión» y «Crear cuenta» (correo y contraseña), el botón «Ingresar con Google» y «Continuar como invitado». Debajo hay un enlace a `/privacidad`.
2. **Invitado o con cuenta:** el mismo mapa, el buscador y las rutas; la cámara (`/camara`) pide cuenta. La barra superior muestra «Ingresar» al invitado, o la foto (o iniciales), el nombre, el rol y «Cerrar sesión» a quien tiene cuenta. El rol solo se muestra: no cambia lo que se ve (todo rol, desde `usuario`, puede usar la cámara).

Las cuentas se pueden abrir con Google o con un correo y una contraseña (de 10 a 128 caracteres). Una cuenta puede tener las dos.

## Estados (`src/lib/session-state.ts`)

| Estado      | Significa                                                                |
| ----------- | ------------------------------------------------------------------------ |
| `entry`     | Nadie eligió todavía (o la sesión murió, o un invitado pulsó «Ingresar») |
| `checking`  | Hay un identificador guardado y se pregunta al backend si vive           |
| `guest`     | La persona eligió entrar como invitado                                   |
| `signed_in` | Sesión válida; se conoce a la persona                                    |

`useSession` (`src/hooks/useSession.ts`) ejecuta las transiciones; las dependencias (red y almacenamiento) se le pasan en las pruebas.

## Qué recuerda el navegador (`src/lib/session-storage.ts`)

| Clave en `localStorage`      | Valor                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `urban-road-monitor.session` | El identificador de sesión (43 caracteres base64url; otro formato se descarta) |
| `urban-road-monitor.guest`   | `1` si la persona eligió entrar como invitado                                  |

Si `localStorage` falta o lanza error (ventanas privadas, datos bloqueados), la app funciona igual: solo olvida la elección.

## Ingreso con Google

1. Al aparecer la pantalla de entrada se carga el script de Google (`https://accounts.google.com/gsi/client`), **solo ahí**: quien entra como invitado nunca habla con Google. Si no carga, se avisa y se puede reintentar.
2. Google devuelve un token de identidad; se envía a `POST /api/auth/google` y el backend responde `{ token, expiresAt, user }`.
3. Se guarda el `token`, se borra la elección de invitado y se muestra a la persona.

Si falla, el mensaje en español sale de `src/lib/auth-errors.ts`: `INVALID_GOOGLE_TOKEN` (401), `ACCOUNT_DISABLED` (403), demasiados intentos (429) y los 503 (`AUTH_PROVIDER_UNAVAILABLE`, `AUTH_NOT_CONFIGURED`, `DATABASE_UNAVAILABLE`). La persona puede reintentar o entrar como invitado.

## Ingreso con correo y contraseña

`POST /api/auth/register` y `POST /api/auth/login` responden lo mismo que el de Google (`{ token, expiresAt, user }`), así que la sesión se abre igual. El formulario revisa el correo y la contraseña antes de enviar y explica cada error según el código (`INVALID_CREDENTIALS`, `EMAIL_TAKEN`, `INVALID_PASSWORD` con la regla que falló, 429, 503). En Configuraciones, una cuenta con contraseña puede cambiarla (`POST /api/auth/password`): se cierran sus otras sesiones y esta sigue.

## Enlaces que llegan por correo

El correo lo manda el backend (por Brevo); el frontend solo pide el envío y recibe a la persona cuando abre el enlace. Cada enlace lleva un token de un solo uso **después de `#`** (`/verificar#token=…`, `/restablecer#token=…`): esa parte nunca viaja a un servidor. La página lo lee, lo guarda en memoria y lo saca de la dirección al abrirse (`src/lib/email-links.ts`); un token con otra forma se trata como si no hubiera enlace.

| Quién lo pide                             | Llamada                            | Qué hace la persona                                                                            |
| ----------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| «¿Olvidaste tu contraseña?» (formulario)  | `POST /api/auth/forgot-password`   | Siempre ve el mismo aviso, tenga o no cuenta ese correo. Se explican 429, 503 y fallos de red  |
| `/restablecer` (enlace de 1 hora)         | `POST /api/auth/reset-password`    | Elige la contraseña nueva; se cierran todas sus sesiones y no se abre una: debe iniciar sesión |
| Configuraciones, grupo «Verificar correo» | `POST /api/auth/verify-email/send` | Aparece solo si el correo no está verificado; un 409 (ya verificado) lo hace desaparecer       |
| `/verificar` (enlace de 24 horas)         | `POST /api/auth/verify-email`      | Se verifica el correo; no necesita sesión, el enlace puede abrirse en otro dispositivo         |

Un `400 INVALID_TOKEN` (vencido, ya usado o de otro tipo) muestra «Este enlace ya no sirve» con el camino para pedir otro. Una contraseña rechazada (`INVALID_PASSWORD`) no gasta el enlace: se puede escribir otra. Una página de enlace no inicia sesión ni despierta la IA.

## Al abrir la página con una sesión guardada

Se llama `GET /api/auth/me` con `Authorization: Bearer <identificador>`:

- **200:** se muestra a la persona.
- **401:** la sesión murió (venció, se cerró o se desactivó la cuenta). Se borra el identificador y se vuelve a la entrada.
- **503, tiempo agotado o sin conexión:** no dicen nada sobre la sesión. Se conserva el identificador y se reintenta a los 3 s, 6 s, … hasta 15 s; la pantalla de comprobación ofrece «Reintentar» y «Entrar como invitado» (que conserva la sesión guardada).

Solo un 401 cierra una sesión.

## Cerrar sesión

La página olvida la sesión **primero** y después llama `POST /api/auth/logout` (204), cuyo fallo se ignora: un error de red no debe dejar a la persona dentro. El backend cierra solo esa sesión, no las de otros dispositivos.

## Páginas públicas

`/privacidad` (`src/components/PrivacyPage.tsx`), `/verificar` y `/restablecer` son públicas: no inicia sesión ni pide nada al backend. `vercel.json` reescribe todas las rutas a `index.html` y `App.tsx` elige la página por la ruta, así que no hace falta un enrutador. Contacto y responsables están en el propio texto; si cambian los datos que guarda el backend, hay que actualizarlo.

## Variable de entorno

`VITE_GOOGLE_CLIENT_ID`: ID de cliente público de Google, el mismo `GOOGLE_CLIENT_ID` del backend. Es público (se ve con F12); el secreto de Google no existe en el frontend. Sin ella, la entrada avisa que el ingreso con Google no está disponible y deja entrar como invitado.

## Pruebas

- Piezas: `session-state`, `session-storage`, `auth-errors`, `email-links`, `person`, `google-identity` y cada componente tienen su prueba.
- Flujo completo con el hook real: `src/App.flow.test.tsx` (invitado, Google, fallo de ingreso, sesión guardada, sesión caducada, servidor dormido, cierre de sesión y privacidad). Solo se reemplazan la red, el script de Google y el mapa.
