# urban-road-monitor-frontend

Aplicación web del proyecto **Detección de Baches y Rutas en Vías Urbanas** (Pasto, Nariño).
Proyecto final de Estructuras de Datos — Kevin Basante y Arley Riascos.

El frontend solo se comunica con el backend (API REST); nunca con la base de datos ni con la IA.

## Tecnologías

- React 19 + TypeScript
- Vite 8
- Node.js 24 (ver `.nvmrc`)

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

| Comando             | Qué hace                                                      |
| ------------------- | ------------------------------------------------------------- |
| `npm run dev`       | Inicia el servidor de desarrollo                              |
| `npm run build`     | Revisa los tipos y genera la versión de producción en `dist/` |
| `npm run preview`   | Sirve localmente la versión de producción                     |
| `npm run typecheck` | Revisa los tipos sin compilar                                 |
| `npm run lint`      | Revisa el código con ESLint                                   |
| `npm run format`    | Da formato al código con Prettier                             |

## Convenciones

- Código, comentarios y nombres en inglés; textos de la interfaz y documentación en español.
- Los commits hechos en conjunto incluyen la línea `Co-authored-by:`.
