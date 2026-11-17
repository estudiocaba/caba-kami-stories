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

## Plantilla «explicativo»

Monigotes que explican un concepto de anime, en unos 30-40 segundos: intro con una fan que saluda → 3 a 5 escenas → el mismo cierre con sello 神. Código en `src/reel/explicativo.js`.

Ficha de ejemplo: `reeles/2026-12-03-cour.json`.

| Campo | Qué es |
|---|---|
| `plantilla` | `explicativo`. |
| `etiqueta`, `titulo` (2 líneas), `subtitulo` | La intro. `anfitriona`: papel del monigote que saluda (por defecto `fan`). |
| `fotos` | Opcional: `{clave: {anime: {busqueda, anio}}}`. La portada oficial de AniList, para mostrarla en una tele. |
| `escenas[]` | Cada una: `rotulo` (MAYÚSCULAS, corto), `objeto`, `monigotes`, `bocadillo`, `dato` y `texto`. `pulsos` opcional (8 por defecto). |
| `objeto.tipo` | `calendario` (`marca`: 0-3 o `todas`), `tira` (`episodios`, `corte`), `tele` (`pantalla` y, con `foto` en la escena, la portada), `tijeras` (`izquierda`, `derecha`, `pausa`), `reloj` (`texto`), `estudio` (`letrero`). |
| `monigotes[]` | 1 o 2: `rol` (`fan`, `estudio`, `cadena`, `autor`), `x` (200-880), `poses` (se reparten en la escena), `mira: "izq"` para girarlo y `camina` (x desde la que entra andando). |
| poses | `parado`, `saluda`, `senala`, `senalaIzq`, `pensar`, `encoge`, `sorpresa`, `celebra`, `llora`, `triste`, `espera`. |
| `bocadillo` | `{de: índice del monigote, texto}`. Máximo unas 45 letras: dos líneas. |
| `dato` | Cifra o idea en grande (admite `*énfasis*`). |
| `texto` | Lo que se explica, 25 palabras como máximo. |

Reglas de composición fijas: rótulo arriba, objeto en la franja de 400 a 670 px, bocadillo al lado de la cabeza del monigote, suelo a 1240 px y debajo el dato y el texto centrados. Los monigotes se animan de a dos, como el resto del reel.
