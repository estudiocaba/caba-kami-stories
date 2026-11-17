# Agencia @caba.kami — notas para cada sesión

- Antes de escribir o revisar una ficha de carrusel o reel (carpetas `caba-kami-stories/carruseles/` y `caba-kami-stories/reeles/`), lee `caba-kami-stories/VOZ.md` y cúmplelo: sin frases de plantilla, castellano neutro (nunca «vosotros»), al menos un dato con fuente.
- En los títulos se puede marcar una palabra con `*asteriscos*`: sale en cursiva plata.
- Texturas y sonidos: solo los de `texturas/` y `sonidos/`, todos de dominio público y registrados en `caba-kami-stories/LICENCIAS.md`. Si se añade uno nuevo, se registra ahí.
- Ningún anime ni personaje se descarta por la estética de su imagen.
- Para retocar el diseño sin volver a consultar AniList: `node src/carrusel/index.js <ficha> --sin-telegram --datos <datos.json de la rama publico>` (igual para `src/reel/index.js`).
- Solo se publica lo que Camila marca como «Programado» en Notion.

## Las brujas (agentes programados)
- **La Vidente** (domingos 18:41): tendencias → tabla Notion «Tendencias» (collection://41b6541a-381b-811b-8040-000b63f7b735).
- **La Escriba** (lunes 10:13): guiones, copys y generación de las piezas en Idea de los próximos 9 días → «Para revisar».
- **La Fábrica**: los workflows carrusel.yml y reel.yml (no es un agente; su estado lo actualizan la Escriba y la Guardiana).
- **La Mensajera** (cada día 19:37): publica solo lo que está en «Programado» con fecha de hoy.
- **La Guardiana** (cada día 21:23): revisa fallos y avisa solo si hay algo nuevo.
- **La Cronista** (día 1, 09:47): informe mensual en la página Notion «Informes de la Cronista».
- Cada bruja actualiza su fila en «Brujas del Aquelarre» (collection://41b6541a-381b-816d-9f2e-000bc3a65976) al terminar. El panel `aquelarre/panel.html` (publicado como artefacto) lee esa tabla y el calendario.
