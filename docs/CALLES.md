# Calles: buscador y resumen por tramo

Esta página explica lo que el mapa muestra sobre una calle completa y cómo se busca una por su nombre.

## Buscador de calles

- El cuadro «Buscar una calle» está en el mapa. Espera 300 ms después de la última tecla, pide al backend `GET /api/roads/search?q=&limit=8` y muestra hasta 8 sugerencias.
- Hacen falta al menos 2 letras. Con menos no se pregunta nada.
- Si llega una respuesta vieja cuando ya se escribió otra cosa, se descarta (cada búsqueda anterior se cancela).
- Funciona con el teclado: flechas para moverse, Enter para elegir, Escape para cerrar. El botón «×» borra el texto.
- El frontend solo muestra lo que el backend responde (el árbol de prefijos vive en el backend). Al elegir una calle, el mapa la encuadra con su `bounds` y la resalta en magenta con un borde blanco.
- Errores: si el servicio no responde o se acabó el límite de peticiones, el cuadro lo dice con un mensaje claro; nunca se interpreta como sesión terminada.

## Resumen al tocar un tramo

Al abrir la ventanita de un tramo se pide `GET /api/road-segments/:id/summary`. Se muestra una tabla con dos columnas:

- **Alrededor**: los tramos cercanos al tocado (radio que decide el backend).
- **Toda la calle**: todos los tramos de la misma calle.

Filas: tramos, longitud, baches a la vista, confirmados, daño y peor gravedad. Solo los baches **confirmados** cuentan para el daño y para las rutas; los «a la vista» son los que se ven en el mapa pero aún no cuentan.

- La respuesta se guarda 10 s (máximo 50 tramos) para no repetir la petición al abrir y cerrar.
- Al cerrar la ventanita, la petición en curso se cancela.
- Si la respuesta no tiene la forma esperada o falla, la ventanita muestra el error en vez de quedarse en «Cargando…».
- En el teléfono el mapa se mueve para que la ventanita no quede bajo el buscador ni «Cómo llegar», y la ventanita se desplaza si es más alta que 380 px.

## Calles de la ruta

Al pedir una ruta, `POST /api/routes` puede devolver `streets`. Cada calle de los pasos muestra cuántos baches hay a lo largo de ella con el mismo resumen del backend.
