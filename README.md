# urban-road-monitor-frontend

Aplicación web del proyecto **Detección de Baches y Rutas en Vías Urbanas** (Pasto, Nariño).
Proyecto final de Estructuras de Datos — Kevin Basante y Arley Riascos.

El frontend solo se comunica con el backend (API REST); nunca con la base de datos ni con la IA.

## Tecnologías

- React 19 + TypeScript
- Vite 8
- Leaflet 1.9 con un mapa base vectorial de OpenFreeMap (dibujado con MapLibre GL; datos de OpenStreetMap, sin clave)
- Vitest y Testing Library para las pruebas
- Node.js 24 (ver `.nvmrc`)

## Qué muestra la aplicación

El mapa de Pasto con todas las calles (unos 10.000 tramos) coloreadas según su estado, y los baches como círculos encima.

- **Calles:** verdes si no tienen baches; amarillas, naranjas o rojas según la severidad del peor bache. Al tocar una calle se abre un cuadro con su nombre, longitud, sentido y costo de ruta.
- **Baches:** el tamaño del círculo indica la severidad; el borde punteado, que todavía no está confirmado; y atenuado, que ya fue reparado. Al tocar uno se ven su confianza y sus fechas.
- **Leyenda plegable** con los conteos, e interruptores para mostrar u ocultar los baches y para incluir los reparados.
- **Cómo llegar:** el botón abre un panel para pedir una ruta. Se toca el mapa para poner el origen (A) y el destino (B), que luego se pueden arrastrar, y se elige el criterio: **Más corta**, **Equilibrada** o **Evitar baches**. La ruta se pide sola cada vez que cambia algo y se dibuja en azul con borde blanco sobre las calles y bajo los baches, con **flechas** que indican el sentido del viaje (aparecen al acercar el mapa, desde el nivel de zoom 16, para que no parezcan una línea punteada cuando se ve toda la ciudad) y una **línea punteada** desde cada clic hasta la esquina donde la ruta empieza o termina. Mientras el panel está abierto, tocar una calle pone un punto en lugar de abrir su cuadro. Al llegar la ruta, el mapa se mueve solo si alguna parte queda fuera de la vista o debajo de los paneles (el de la ruta y la leyenda), y el panel muestra dónde quedaron A y B (latitud y longitud). En el computador el panel va arriba a la izquierda y en el teléfono sube desde abajo, como una hoja. Los colores del panel cambian con el tema claro u oscuro, y una prueba comprueba que cada texto tenga al menos 4,5 de contraste en los dos.
- **Recorrer la ruta calle por calle:** el panel resume la ruta (distancia, calles, tramos y cuántos tienen daño) y la lista por calles, porque una ruta larga tiene decenas de tramos de una cuadra: los tramos seguidos de la misma calle se agrupan. **Anterior** y **Siguiente** (o las flechas del teclado) avanzan de calle en calle y dan la vuelta: después de la última calle viene la primera, y sin ninguna elegida, Anterior va a la última (las calles se guardan en una lista circular doble hecha a mano); la calle elegida se resalta en violeta en el mapa, el mapa se acerca a ella y se abre para mostrar sus tramos uno por uno. **Escape** o "Ver toda la ruta" vuelven a la ruta completa.
- **Detalles técnicos y comparación de algoritmos:** un bloque plegable muestra el algoritmo, los nodos explorados, el tiempo de cálculo, el costo y si salió de la caché. El botón **Comparar con Dijkstra** pide la misma ruta con el otro algoritmo y los pone lado a lado: dan el mismo costo, pero A* explora menos nodos. Cuesta una petición más.
- **Diseño:** una paleta verde con tema claro y oscuro (la pantalla de entrada y la cámara son oscuras en los dos), la fuente Archivo para los textos y JetBrains Mono para las cifras. Los botones de zoom y **Centrar** van abajo a la derecha; en el teléfono la leyenda se pliega bajo el buscador y **Cómo llegar** queda abajo, al alcance del pulgar.
- **Pantallas de carga y de error:** mientras llegan los datos se ve la carretera de la petición (navegador, servidor y base de datos); si algo falla, marca dónde se cortó y ofrece reintentar. El servidor gratuito de Render se duerme, así que la primera carga puede tardar hasta un minuto.

Los datos vienen del backend (ver `docs/API-MAPA.md` y `docs/API-RUTAS.md`). La versión desplegada en Vercel usa la base `production`, que no tiene baches de prueba, así que se ve toda verde. Para ver los colores, corre el backend en tu computador contra la base `development` y apunta `VITE_API_URL` a `http://localhost:3000`.

## Instalación

```bash
git clone https://github.com/<usuario>/urban-road-monitor-frontend.git
cd urban-road-monitor-frontend
npm install
npm run dev
```

La aplicación se abre en `http://localhost:5173`.

## Variables de entorno

| Variable                | Descripción                                                                                                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`          | URL del backend, sin `/` al final. Por defecto `http://localhost:3000`                                                                                                                                               |
| `VITE_AI_SERVICE_URL`   | Opcional. Dirección pública del servicio de IA, solo para despertarlo desde el navegador (ver más abajo)                                                                                                             |
| `VITE_GOOGLE_CLIENT_ID` | Opcional. ID de cliente público del ingreso con Google (el mismo `GOOGLE_CLIENT_ID` del backend). Sin él, la pantalla de entrada avisa que el ingreso con Google no está disponible y solo deja entrar como invitado |

**Por qué el navegador despierta al servicio de IA.** En el plan gratuito de Render, el servicio de IA (que calcula las rutas) se duerme tras unos minutos sin uso, y Render solo lo despierta cuando lo pide un navegador: si lo pide el backend, responde `hibernate-rate-limited` y no lo despierta (comprobado en producción). Por eso, al abrir la app, el navegador hace una petición a `VITE_AI_SERVICE_URL/health` sin esperar la respuesta, y si una ruta responde 503 con `retryAfterS`, la app espera esos segundos, lo despierta de nuevo y reintenta (hasta 4 intentos). Si aun así no despierta, el panel ofrece un enlace que abre el servicio en otra pestaña. Esa dirección es pública y no lleva ningún token.

**Cuenta y sesión.** Al abrir la app sin sesión aparece una pantalla de entrada con el botón de Google y «Continuar como invitado»; el invitado ve el mapa, el buscador y las rutas, y quien ingresa con Google además puede usar la cámara; el rol solo se muestra. El detalle del flujo está en `docs/AUTENTICACION.md`. La página `/privacidad` explica qué datos se guardan y cómo pedir su borrado.

**Cámara.** La página `/camara` detecta baches con el modelo entrenado, dentro del navegador, y muestra el rendimiento y el tamaño de cada bache. Con una cuenta de Google guarda cada bache en el teléfono y lo envía al backend; a un invitado la página le pide ingresar en lugar de abrir la cámara. El detalle está en `docs/CAMARA.md` y `docs/ENVIO.md`.

**Calles.** El mapa tiene un buscador de calles y, al tocar un tramo, una ventanita con el resumen del tramo y de toda la calle. Ver `docs/CALLES.md`.

Para apuntar a otro backend en local, copia `.env.example` como `.env` y cambia el valor. En Vercel se configura en **Settings → Environment Variables**.

Todo lo que empieza con `VITE_` queda visible en el navegador (se puede ver con F12), así que aquí **nunca** van claves ni contraseñas: esas viven solo en el backend.

## Scripts

| Comando              | Qué hace                                                      |
| -------------------- | ------------------------------------------------------------- |
| `npm run dev`        | Inicia el servidor de desarrollo                              |
| `npm run build`      | Revisa los tipos y genera la versión de producción en `dist/` |
| `npm run preview`    | Sirve localmente la versión de producción                     |
| `npm run typecheck`  | Revisa los tipos sin compilar                                 |
| `npm run lint`       | Revisa el código con ESLint                                   |
| `npm run format`     | Da formato al código con Prettier                             |
| `npm test`           | Ejecuta las pruebas unitarias con Vitest                      |
| `npm run test:watch` | Ejecuta las pruebas y las repite al guardar cambios           |

## Despliegue en Vercel

La configuración está en `vercel.json` (Vite, compila con `npm run build` y publica `dist/`).

1. En vercel.com: **Add New → Project** e importa este repositorio.
2. En **Environment Variables** agrega `VITE_API_URL` con la URL del backend en Render, sin `/` al final, `VITE_AI_SERVICE_URL` con `https://urban-road-monitor-ai.onrender.com` y `VITE_GOOGLE_CLIENT_ID` con el ID de cliente de Google (el mismo que usa el backend).
3. Pulsa **Deploy**.

Cada push a `main` vuelve a desplegar automáticamente. Si cambias `VITE_API_URL`, `VITE_AI_SERVICE_URL` o `VITE_GOOGLE_CLIENT_ID`, hay que volver a desplegar (**Deployments → Redeploy**), porque Vite la incluye al compilar.

Después de desplegar, agrega la URL de Vercel a la variable `CORS_ORIGIN` del backend en Render; si no, el navegador bloqueará las peticiones.

## Estructura

```
public/               Archivos estáticos (ícono)
docs/                 Contratos del API del mapa (API-MAPA.md) y de las rutas (API-RUTAS.md) y el flujo de cuenta (AUTENTICACION.md) y la cámara (CAMARA.md), el envío (ENVIO.md) y las calles (CALLES.md)
src/
├── api/              Cliente HTTP, funciones que llaman al backend (mapa, rutas y cuenta) y despertar del servicio de IA
├── components/       Pantallas y piezas de la interfaz (entrada, botón de Google, cuenta, privacidad, mapa, leyenda, Cómo llegar, carga, error, logo e íconos)
├── config/           URL del backend y del servicio de IA
├── i18n/             Idiomas (español e inglés): diccionarios, función `translate`, proveedor, guardado de la elección y selector
├── hooks/            Carga de los datos del mapa, petición de la ruta (con reintentos) y sesión de la persona
├── lib/              Lógica pura: estados y almacenamiento de la sesión, carga del script de Google, formatos, estilos del mapa, leyenda, criterios, errores, agrupación por calle y geometría de las flechas
├── map/              Código de Leaflet: mapa base, capas de calles y baches, marcadores, línea, flechas y resaltado de la ruta
├── structures/       Estructuras de datos hechas a mano: lista circular doble (recorrido de las calles de la ruta)
├── test/             Configuración de las pruebas y datos de muestra
├── types/            Tipos del contrato del API
├── App.tsx           Elige entre la página de privacidad, la entrada, la comprobación de la sesión y el mapa
├── main.tsx          Punto de entrada
├── map.css           Estilos del mapa y sus paneles
├── account.css       Estilos de la cuenta en la barra superior
├── language.css      Estilos del selector de idioma
├── entry.css         Estilos de la pantalla de entrada y del botón de Google
├── privacy.css       Estilos de la página de privacidad
├── popups.css        Estilos de los cuadros de información
└── styles.css        Colores del tema (claro y oscuro), logo y estilos base y de las pantallas de carga y error
```

## Idiomas

La app tiene dos idiomas, español (el original y el que se ve la primera vez) e inglés. La elección se guarda en el navegador y se ve en el atributo `lang` de la página.

- Los textos viven en `src/i18n/messages.es.ts` y `src/i18n/messages.en.ts`, con claves `area.nombre` (por ejemplo `language.label`). El inglés debe tener exactamente las mismas claves: el compilador lo comprueba, y una prueba revisa además que ningún texto quede vacío y que los dos idiomas usen las mismas variables.
- Un texto con una parte variable la escribe como `{nombre}` y se llena con `t('clave', { nombre: valor })`. Un valor que parezca una variable (una calle llamada `{nombre}`) se muestra tal cual, nunca se expande.
- En un componente: `const { t } = useLanguage();` y luego `t('clave')`. Sin proveedor arriba, `useLanguage` da español y un idioma que no se puede cambiar, así que una pieza se puede mostrar o probar sola.
- Para agregar un texto: se escribe primero en español, se copia la clave al inglés y se usa con `t`. Los nombres de las calles y los datos que llegan del servidor no se traducen.
- `LanguageSwitch` es el selector de dos botones; cada uno lleva su nombre en su propio idioma ("Español", "English").

## Dependencias y seguridad

- Las versiones están fijas (sin `^` ni `~`) y solo se usan versiones con al menos dos semanas de publicadas.
- `npm audit --omit=dev`, que es lo que llega al usuario, debe dar **0 vulnerabilidades**.
- `package.json` fija `zod` con `overrides`: llega por `eslint-plugin-react-hooks` y las versiones anteriores a 4.6.6 tienen una vulnerabilidad. Cuando el plugin lo actualice, se puede quitar el `override`.
- Con `npm audit` completo quedan avisos moderados en la cadena de ESLint (`minimatch`). Son herramientas de lint que no llegan al sitio, y todavía no tienen una corrección segura: `npm` solo sugiere cambios de versión mayor o bajadas de versión.
- **No se ejecuta `npm audit fix --force`**: cambiaría versiones sin control.

## Equipo y responsabilidades

| Integrante    | Responsabilidad                                            |
| ------------- | ---------------------------------------------------------- |
| Kevin Basante | Todos los commits del frontend                             |
| Arley Riascos | Todos los commits del backend y de la implementación de IA |

Los dos trabajan juntos en videollamada para que ambos conozcan todo el proyecto. Los primeros commits de cada repositorio se hicieron en conjunto y llevan la línea `Co-authored-by:`.

## Convenciones

- Código, comentarios y nombres en inglés; textos de la interfaz y documentación en español.
- Todo se trabaja directo en `main`, sin ramas ni pull requests (indicación del profesor). Antes de empezar y antes de cada `push` se hace `git pull`.
- Commits pequeños, uno por cambio con sentido, con el mensaje en inglés y prefijos convencionales: `feat`, `fix`, `test`, `docs`, `chore`, `refactor`, `perf`, `style`.
- Cada integrante hace sus commits con su propia cuenta de GitHub. Solo los commits hechos en conjunto incluyen la línea `Co-authored-by:`.
- Antes de cada commit se ejecutan `npm run typecheck`, `npm run lint` y `npm test`.
