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

Los reels explicativos tienen su propio mundo, distinto del de las listas: **pixel art** de juego de los 90 (escena de 180×320 píxeles ampliada a 1080×1920), las **brujitas del Aquelarre** en una torre con caldero, **voz en off** de la Vidente y **vals de bruja** en lugar de lofi. Código en `src/reel/grimorio.js`; la voz, en `src/voz/narrar.py`.

Las portadas de anime van en una capa aparte a resolución completa: se ven nítidas aunque la escena sea pixel art.

Habla el idioma del anime y de las redes a la vez:
- **Gancho en el primer segundo**: la voz arranca enseguida y un espejo mágico pasa portadas de anime reales.
- **Subtítulos grandes palabra por palabra**, sincronizados con la voz (el motor da el momento de cada palabra); la que suena, en vino.
- **Brujitas con cara de anime** (ojos grandes con brillo, rubor) y gestos de anime: «!» de sorpresa, «?», gota de sudor, venita de enfado, lágrimas a chorro, rayas de bajón, chispas al celebrar.
- **Onomatopeya en japonés** en cada revelación, con líneas de impacto de manga, zoom de golpe y temblor.
- **Cortes que varían**: iris, barrido en diagonal y flash. El dato sale como una pegatina que se balancea.

La duración de cada escena sale de la voz y se redondea al pulso de la música.

Ficha de ejemplo: `reeles/2026-12-03-cour.json`.

| Campo | Qué es |
|---|---|
| `plantilla` | `explicativo`. |
| `musica` | `caldero` (vals en re menor, 96 bpm) o `hechizo` (la menor, 88 bpm), de `musica/grimorio.py`. |
| `voz` | `{motor, voz, velocidad, tono}`. Motor `gemini` (`voz` = Laomedeia, Zephyr…; necesita `GEMINI_API_KEY`; se le pide entusiasmo con `estilo_gemini`), motor `elevenlabs` (`voz` = voice_id; necesita `ELEVENLABS_API_KEY`; en el plan gratuito el copy añade la atribución), `azure` (oficial, con `AZURE_SPEECH_KEY` y `AZURE_SPEECH_REGION`), `edge` (voces de Microsoft, para pruebas) o `piper` (Daniela, libre). |
| `pronunciacion` | Palabras que la voz debe leer distinto: `{"cour": "cur"}`. Solo cambia el audio, no el texto. Sirve también para tildes de apoyo: `{"abran": "ábran"}` (las más comunes ya vienen puestas). |
| `tema` | Tema que sale en la cabecera de cada lección. |
| `etiqueta`, `titulo` (1 línea corta), `intro` | El gancho: `voz` (una pregunta o una queja, nunca un saludo), `fotos` (claves de `fotos` que pasan por el espejo), `onomatopeya` y `brujas`. |
| `fotos` | Opcional: `{clave: {anime: {busqueda, anio}}}`, para el espejo del gancho y para la tele. |
| `escenas[]` | 3 a 5: `titulo`, `objeto`, `brujas`, `dato` (pegatina), `voz` (30 palabras como máximo), `onomatopeya` (ドン！, ジャーン, ガーン, キラッ…) y `foto` opcional. |
| `objeto.tipo` | `calendario` (`marca`: 0-3 o `todas`, `etiquetas`), `tira` (`episodios`, `corte`), `tele` (`pantalla`), `tijeras` (`izquierda`, `derecha`, `pausa`), `reloj` (`texto`), `estudio` (`letrero`). |
| `brujas[]` | 1 o 2. La primera narra (izquierda); la segunda reacciona (derecha). `id`: `vidente`, `escriba`, `mensajera`, `guardiana`, `cronista`. `poses`: `varita`, `senala`, `parado`, `sorpresa`, `celebra`, `pensar`, `llora`, `triste`, `encoge`, `enfado`. |
| `cierre` | `etiqueta`, `pregunta` (2 líneas, elegible: «¿A o B?»), `cta` y `voz`. |
