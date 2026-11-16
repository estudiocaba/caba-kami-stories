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
| `audio` | Sugerencia de música para elegir en Instagram. |
| `copy`, `hashtags` | Texto de la publicación. |

Opcionales: `intro`, `porElemento` y `outro`, en segundos (por defecto 2,6 · 3,6 · 3).

## Cómo se usa

- Subir o cambiar una ficha en `reeles/` genera el vídeo y lo guarda en la rama `publico` (`reeles/<ficha>/`).
- *Actions → Reel de anime → Run workflow* con la ficha y `telegram` activado: lo genera y lo manda a Telegram con el copy.
- *Actions → Publicar reel → Run workflow*: lo publica en Instagram (necesita el acceso a la API de Meta).

## Audio

El vídeo lleva una pista de audio en silencio. La música de la biblioteca de Instagram no se puede añadir por API: si se publica automáticamente, sale sin música; para usar un audio en tendencia, se elige al publicar o editar desde la app.

## Pendiente

La plantilla «explicativo» (muñequitos de palo que explican un concepto) todavía no existe.
