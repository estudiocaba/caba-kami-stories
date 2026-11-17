# Reels de caba.kami

Generador de reels verticales (1080×1920, 30 fps, unos 15 segundos) con la misma identidad que los carruseles: negro, gris humo, vino y plata, arcos ojivales, puntilla de encaje, destellos, grano y líneas de VHS.

## Plantilla «lista»

Intro con título → una escena por elemento (foto oficial de AniList en el arco, nombre, dato y subtítulo estilo fansub) → cierre con pregunta y sello 神. Sirve para recomendaciones por mood, tops, estrenos y husbandos.

Ficha de ejemplo: `reeles/2026-12-06-moods.json`.

| Campo | Qué es |
|---|---|
| `pieza`, `fecha` | Nombre y fecha de publicación (como en Notion). |
| `plantilla` | `lista`. |
| `etiqueta`, `titulo` (2 líneas), `subtitulo` | La intro. |
| `items[]` | 2 a 5 elementos: `etiqueta` (por ejemplo `MOOD MANTITA`), `nombre`, `anime` (`{busqueda}`) o `personaje` + `animeDelPersonaje`, `dato` (admite `{nota}`, `{episodios}`, `{estudio}`, `{anio}`, `{horas}`) y `subtitulo` (frase corta con humor, 12 palabras como máximo). |
| `cierre` | `pregunta` (2 líneas) y `cta`. |
| `musica` | Pista de lofi propio: `medianoche`, `luna-roja`, `niebla` o `vela`. Si falta, se elige una según el nombre de la ficha. |
| `copy`, `hashtags` | Texto de la publicación. |

El montaje se mide en pulsos de la pista elegida: intro de un compás (la batería entra en el primer corte), 5 pulsos por elemento, 1 de eyecatch y 5 de cierre. Así todos los cortes caen en el golpe.

## Cómo se usa

- Subir o cambiar una ficha en `reeles/` genera el vídeo y lo guarda en la rama `publico` (`reeles/<ficha>/`).
- *Actions → Reel de anime → Run workflow* con la ficha y `telegram` activado: lo genera y lo manda a Telegram con el copy.
- *Actions → Publicar reel → Run workflow*: lo publica en Instagram (necesita el acceso a la API de Meta).

## Música

Cada reel sale con **lofi oscuro propio**, compuesto por código en `musica/componer.py` (piano eléctrico, bajo, batería suave con swing, colchón oscuro, caja de música, crujido de vinilo y cinta que ondula). Al ser música original no tiene derechos de terceros: Instagram la muestra como audio original de la cuenta y no la silencia por copyright.

| Pista | Tono | Tempo | Carácter |
|---|---|---|---|
| `medianoche` | Re menor | 72 bpm | La más equilibrada; la de por defecto para recomendaciones. |
| `luna-roja` | La menor | 68 bpm | La más lenta y melancólica. |
| `niebla` | Mi menor | 76 bpm | Algo más de pulso, para tops y estrenos. |
| `vela` | Do menor | 70 bpm | La más oscura. |

Para crear más pistas: añadir una entrada en `PISTAS` dentro de `componer.py` (tono, tempo, acordes y semilla) y ejecutar `python3 musica/componer.py <nombre>`.

## Efectos de sonido

`src/reel/sfx.js` sintetiza desde cero un efecto para cada gesto del motion graphics y los coloca en el tiempo exacto: play de VHS al empezar, fallo de cinta en cada corte (con la música bajando un instante), soplido cuando sube la foto, teclas de máquina en las etiquetas, campanitas en los destellos, brillo en los títulos, tic-tic de los contadores, golpe con campana en el eyecatch, golpe seco del sello y stop de cinta al final.

## Plantilla «explicativo»: el grimorio del Aquelarre

Los reels explicativos tienen su propio mundo, distinto del de las listas: **pixel art** de juego de los 90 (escena de 180×320 píxeles ampliada a 1080×1920), las **brujitas del Aquelarre** en una torre con caldero, **voz en off** de la Vidente, **vals de bruja** en lugar de lofi y cortes con **cierre de iris** en lugar de fallo de VHS. Código en `src/reel/grimorio.js`; la voz, en `src/voz/narrar.py`.

En cada escena la Vidente conjura con la varita la idea que explica (círculo mágico, chispas y el objeto que aparece en el humo), su boca se mueve con la voz y lo que dice sale en una caja de diálogo al ritmo de la voz. Debajo, el dato en un pergamino. La duración de cada escena sale de la voz y se redondea al pulso de la música.

Ficha de ejemplo: `reeles/2026-12-03-cour.json`.

| Campo | Qué es |
|---|---|
| `plantilla` | `explicativo`. |
| `musica` | `caldero` (vals en re menor, 96 bpm) o `hechizo` (la menor, 88 bpm), de `musica/grimorio.py`. |
| `voz` | `{motor, voz, velocidad}`. Motor `azure` (oficial, con `AZURE_SPEECH_KEY` y `AZURE_SPEECH_REGION` en los secretos), `edge` (las mismas voces, para pruebas) o `piper` (Daniela, libre). |
| `pronunciacion` | Palabras que la voz debe leer distinto: `{"cour": "cur"}`. Solo cambia el audio, no el texto. |
| `narradora`, `tema` | Nombre en la caja de diálogo y tema que sale en la cabecera de cada lección. |
| `etiqueta`, `titulo` (2 líneas), `subtitulo`, `intro.voz` | La portada con la bruja en escoba cruzando la luna. |
| `fotos` | Opcional: `{clave: {anime: {busqueda, anio}}}`, para la tele (la portada sale pixelada). |
| `escenas[]` | 3 a 5: `titulo`, `objeto`, `brujas`, `dato`, `voz` (lo que dice la narradora, 30 palabras como máximo) y `foto` opcional. |
| `objeto.tipo` | `calendario` (`marca`: 0-3 o `todas`, `etiquetas`), `tira` (`episodios`, `corte`), `tele` (`pantalla`), `tijeras` (`izquierda`, `derecha`, `pausa`), `reloj` (`texto`), `estudio` (`letrero`). |
| `brujas[]` | 1 o 2. La primera narra (izquierda); la segunda reacciona (derecha). `id`: `vidente`, `escriba`, `mensajera`, `guardiana`, `cronista`. `poses`: `varita`, `senala`, `parado`, `sorpresa`, `celebra`, `pensar`, `llora`, `triste`, `encoge`, `camina`. |
| `cierre` | `pregunta` (2 líneas), `cta` y `voz`. |
