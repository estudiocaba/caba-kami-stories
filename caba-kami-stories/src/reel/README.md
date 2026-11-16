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

Opcionales: `intro`, `porElemento` y `outro`, en segundos (por defecto 2,6 · 3,6 · 3).

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

## Pendiente

La plantilla «explicativo» (muñequitos de palo que explican un concepto) todavía no existe.
