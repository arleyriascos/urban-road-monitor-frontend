# La cámara y el detector de baches

La pantalla `/camara` abre la cámara del dispositivo, busca baches en el video con un modelo que corre **dentro del navegador** y dibuja un recuadro sobre cada uno. Tiene dos medidores: uno de rendimiento y otro de tamaño y gravedad. Con una **cuenta de Google** además guarda cada bache con la ubicación del teléfono y lo envía al servidor (ver `docs/ENVIO.md`). Un **invitado** no abre la cámara: la pantalla le pide ingresar con Google y le recuerda que el mapa, el buscador y las rutas siguen disponibles.

## Privacidad

Las imágenes de la cámara se analizan en el dispositivo y no salen de él: no se guarda ni se envía ninguna foto ni video. Lo único que sale, y solo con una cuenta, es dónde está cada bache y qué tan grande se ve. La pantalla lo dice en una nota visible. La cámara solo se enciende cuando la persona pulsa «Activar la cámara», y se apaga al pulsar «Apagar la cámara» o al salir de la pantalla.

## Cómo funciona

1. **Activar la cámara** abre la cámara trasera (`facingMode: environment`, ideal 1280×720, sin audio) y empieza a descargar el modelo.
2. El modelo es `public/models/pothole/best.onnx` (YOLOv8n, una clase: `pothole`, entrada de 416×416). Lo ejecuta `onnxruntime-web` con WebAssembly en un solo hilo, así no hace falta aislar la página con cabeceras especiales. Los archivos del motor se copian a `public/ort/` con `npm run copy-ort` (se hace solo antes de `dev` y `build`; esa carpeta no se sube a git).
3. Con la cámara y el modelo listos, un bucle analiza un cuadro cada ~333 ms (unas 3 detecciones por segundo). Nunca corren dos detecciones a la vez: si el teléfono es más lento, la siguiente empieza cuando termina la anterior. El bucle se pausa mientras la página está oculta.
4. Cada cuadro pasa por: ajuste a un cuadrado de 416×416 sin deformar (relleno gris 114) → píxeles a planos de números entre 0 y 1 → modelo → lectura de la salida (5 filas × 3.549 candidatos) con umbral de confianza 0,4 → supresión de no máximos (IoU 0,5, máximo 20) → cajas devueltas a los píxeles del cuadro.

El código está en `src/detection/` (el proceso, sin React), `src/camera/` (abrir la cámara y explicar sus errores) y `src/hooks/` + `src/components/` (la pantalla).

## Los dos medidores

**Rendimiento.** Detecciones por segundo, tiempo del modelo y tiempo total por cuadro (mediana de las últimas 30 mediciones, para que un cuadro lento no mueva el número) y tiempo de carga del modelo (descarga + arranque).

**Tamaño y gravedad.** Para cada recuadro, la parte del cuadro que cubre y su gravedad:

| Gravedad | Parte del cuadro |
| -------- | ---------------- |
| leve     | menos de 1 %     |
| moderado | de 1 % a 4 %     |
| grave    | 4 % o más        |

Estos límites (`SEVERITY_LIMITS` en `src/detection/severity.ts`) son **valores iniciales**: se ajustarán con datos reales. La gravedad siempre está escrita con palabras; el color es solo una ayuda.

## Cómo probar

1. `npm run dev` y abrir `http://localhost:5173/camara` (en `localhost` el navegador deja usar la cámara sin https).
2. En un teléfono hace falta https: probar en la versión desplegada en Vercel.
3. Si el permiso se negó, la pantalla explica cómo activarlo en los ajustes del navegador.

## Lo que falta

- Probar en teléfonos reales (Android y iPhone) y ajustar la velocidad según lo que midan los medidores.
- Ajustar los límites de gravedad.
