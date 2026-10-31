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
- **Pantallas de carga y de error:** mientras llegan los datos se ve la carretera de la petición (navegador, servidor y base de datos); si algo falla, marca dónde se cortó y ofrece reintentar. El servidor gratuito de Render se duerme, así que la primera carga puede tardar hasta un minuto.

Los datos vienen del backend (ver `docs/API-MAPA.md`). La versión desplegada en Vercel usa la base `production`, que no tiene baches de prueba, así que se ve toda verde. Para ver los colores, corre el backend en tu computador contra la base `development` y apunta `VITE_API_URL` a `http://localhost:3000`.

## Instalación

```bash
git clone https://github.com/<usuario>/urban-road-monitor-frontend.git
cd urban-road-monitor-frontend
npm install
npm run dev
```

La aplicación se abre en `http://localhost:5173`.

## Variables de entorno

| Variable       | Descripción                                                            |
| -------------- | ---------------------------------------------------------------------- |
| `VITE_API_URL` | URL del backend, sin `/` al final. Por defecto `http://localhost:3000` |

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
2. En **Environment Variables** agrega `VITE_API_URL` con la URL del backend en Render, sin `/` al final.
3. Pulsa **Deploy**.

Cada push a `main` vuelve a desplegar automáticamente. Si cambias `VITE_API_URL`, hay que volver a desplegar (**Deployments → Redeploy**), porque Vite la incluye al compilar.

Después de desplegar, agrega la URL de Vercel a la variable `CORS_ORIGIN` del backend en Render; si no, el navegador bloqueará las peticiones.

## Estructura

```
public/               Archivos estáticos (ícono)
docs/                 Contrato del API del mapa (API-MAPA.md)
src/
├── api/              Cliente HTTP y funciones que llaman al backend
├── components/       Pantallas y piezas de la interfaz (mapa, leyenda, carga, error)
├── config/           URL del backend
├── hooks/            Carga de los datos del mapa (carga, error y resultado)
├── lib/              Lógica pura: formatos, estilos del mapa, leyenda y cuadros de información
├── map/              Código de Leaflet: mapa base y capas de calles y baches
├── test/             Configuración de las pruebas y datos de muestra
├── types/            Tipos del contrato del API
├── App.tsx           Elige entre la pantalla de carga, la de error y el mapa
├── main.tsx          Punto de entrada
├── map.css           Estilos del mapa y sus paneles
├── popups.css        Estilos de los cuadros de información
└── styles.css        Estilos base y de las pantallas de carga y error
```

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
