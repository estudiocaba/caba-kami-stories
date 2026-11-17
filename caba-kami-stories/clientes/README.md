# Clientes del Aquelarre: stories diarias

Cada cliente tiene su carpeta `clientes/<cuenta>/` (el nombre de la cuenta igual que en Notion, en minúsculas):

```
clientes/<cuenta>/
  marca.json              colores, fuentes, logo y conexión con Instagram
  logo.png                opcional
  fotos/                  fotos del cliente para las plantillas con foto
  stories/<lunes>.json    la semana de stories (la escribe La Escriba)
  carruseles/<fecha>-<slug>.json   carruseles del cliente
```

## marca.json

| Campo | Qué es |
| --- | --- |
| `nombre`, `handle` | Salen en el pie de cada story. |
| `colores` | `fondo`, `texto`, `acento` (etiquetas, cifras y palabras con `*asteriscos*`), `suave` y `linea`. |
| `fuentes` | `titulo` y `texto`: cualquier fuente de Google Fonts por su nombre. |
| `pesoTitulo`, `esquinas` | Grosor del titular (400–700) y redondeo de cajas y fotos en px (0 = rectas). |
| `logo` | Ruta dentro de la carpeta (`logo.png`) o `null` para escribir el nombre. |
| `plantillas` | Lista de plantillas que el cliente permite (si falta, todas). Si la semana usa otra, no se genera nada. |
| `prohibido` | Lo que nunca se publica de este cliente, en frases cortas (lo lee La Escriba). |
| `reglas` | `evitar` (palabras prohibidas y su alternativa, p. ej. `{"pelo": "cabello"}`), `sinPrecios`, `sinHorarios`, `peninsular: false`. Se revisan antes de generar: si algo no cumple, no se genera y se dice por qué. |
| `cta` | Llamada a la acción fija del cliente (sale en el cierre de los carruseles). |
| `musica` | Pistas propias para las stories en video (`brillo`, `seda`, `verano`, de `musica/luminosa.py`). |
| `stories` | `activo: true` para que se publiquen solas cada mañana (si están aprobadas); `video: true` y `duracion` (segundos) para stories en video con animación, transición y música. |
| `instagram` | Nombres de los secretos de GitHub con el token y el id de la cuenta: `{"secretoToken": "IG_TOKEN_<CUENTA>", "secretoUsuario": "IG_USER_<CUENTA>"}`. Nunca el token en sí. |

## Plantillas

Cada story de la semana es `{"fecha": "AAAA-MM-DD", "plantilla": "...", ...campos}`. En los textos, `*palabra*` sale con el color de acento.

| Plantilla | Campos | Para |
| --- | --- | --- |
| `frase` | `etiqueta`, `texto`, `firma` | Consejo, frase, idea del día |
| `dato` | `etiqueta`, `cifra`, `unidad`, `texto`, `fuente` | Un número con su fuente |
| `pregunta` | `etiqueta`, `pregunta`, `opciones` (2–4), `pie` | Conversación (se responde por mensaje: la API no pone encuestas) |
| `promo` | `etiqueta`, `titulo`, `precio`, `detalle`, `cta`, `valido` | Ofertas y lanzamientos |
| `foto` | `foto`, `etiqueta`, `texto` | Trabajo real, equipo, local |
| `antesdespues` | `antes`, `despues`, `etiqueta`, `texto` | Peluquería, estética, reformas |
| `agenda` | `etiqueta`, `titulo`, `items` (`[{hora, texto}]`), `pie` | Huecos libres, horario, programa de un evento |
| `cuentaatras` | `etiqueta`, `hasta` (fecha) o `dias`, `texto` | Eventos, fiestas, lanzamientos |

Las fotos pueden ser una ruta dentro de la carpeta del cliente (`fotos/x.jpg`) o una URL.

## Carruseles de clientes

`clientes/<cuenta>/carruseles/<fecha>-<slug>.json`: `{"fecha", "pieza", "diapositivas": [...], "copy", "hashtags", "fuentes", "alt"}`.

| Tipo | Campos | Para |
| --- | --- | --- |
| `portada` | `etiqueta`, `titulo`, `bajada`, `foto` | Primera diapositiva |
| `color` | `numero`, `nombre`, `tonos` (lista de colores #hex), `texto`, `fuente` | Tendencias de color (muestra de color) |
| `punto` | `numero`, `titulo`, `texto`, `foto`, `fuente` | Un corte, un peinado, un tip |
| `lista` | `titulo`, `items` | Pasos o resumen |
| `cierre` | `titulo`, `texto` | Última diapositiva, con la llamada a la acción de la marca |

Generar: `node src/clientes/carrusel.js <cuenta> <ficha>` o el workflow **Carrusel de cliente (generar)** (`carrusel-cliente.yml`, admite un prefijo como `2026-12` para todo el mes). Publicar: **Carrusel de cliente (publicar)**, solo desde La Mensajera.

## Cómo fluye

1. **Lunes, La Escriba** escribe `stories/<lunes>.json` con las 7 stories, lanza **Stories de clientes (generar)** (`stories.yml`) y crea en el calendario de Notion una fila por día con Formato = Story y Estado = «Para revisar». Las imágenes llegan a Telegram.
2. **Camila** marca como «Programado» las que aprueba.
3. **Cada tarde, La Mensajera** anota en la rama `publico` (`stories/<cuenta>/aprobadas.txt`) las stories aprobadas del día siguiente.
4. **Cada mañana, Stories de clientes (publicar)** (`publicar-stories.yml`) publica la del día de cada cliente con `stories.activo`, solo si está aprobada, y la anota en `publicadas.txt`.

Probar en local: `node src/stories/index.js ejemplo-salon --sin-telegram` (deja las imágenes en `out/stories/ejemplo-salon/`).

`ejemplo-salon` es un cliente inventado para enseñar las plantillas: no se publica nunca.
