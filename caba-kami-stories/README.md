# Story diaria de anime · «Hoy se emite»

Cada mañana este proyecto:

1. Consulta **AniList** (gratis, sin clave) para ver qué episodios se emiten hoy en Japón.
2. Se queda con los más populares (7 como máximo) y los ordena por hora, en hora peninsular.
3. Genera la story en PNG de 1080×1920 con el diseño de @caba.kami: título en romaji y debajo, en pequeño, el título en inglés.
4. Te la manda por **Telegram**, junto con un texto listo para copiar como caption.

Coste: 0 €. Corre en GitHub Actions; un trabajo diario de un par de minutos queda muy por debajo del límite gratuito.

---

## Puesta en marcha (unos 15 minutos, una sola vez)

### 1. Crear el bot de Telegram

1. En Telegram, abre un chat con **@BotFather** y escribe `/newbot`.
2. Ponle un nombre (por ejemplo «Stories Anime») y un usuario que acabe en `bot`.
3. BotFather te da un **token** del tipo `123456:ABC-xyz…`. Guárdalo.
4. Abre el chat con tu bot nuevo y escríbele cualquier cosa («hola»).
5. Para saber tu **chat id**, abre en el navegador
   `https://api.telegram.org/bot<TU_TOKEN>/getUpdates`
   y busca `"chat":{"id": 123456789`. Ese número es tu chat id.

### 2. Subir el proyecto a GitHub

1. Crea un repositorio nuevo en GitHub. Puede ser **privado**.
2. Sube todos los archivos de esta carpeta, sin `node_modules` ni `out`. Si lo haces desde la web: *Add file → Upload files* y arrastra la carpeta.
   - Comprueba que se ha subido `.github/workflows/story-diaria.yml`. Al arrastrar, a veces las carpetas que empiezan por punto no se suben; si falta, créalo a mano con *Add file → Create new file* y pega el contenido.

### 3. Guardar el token y el chat id como secretos

En el repositorio: *Settings → Secrets and variables → Actions → New repository secret*.

| Nombre | Valor |
|---|---|
| `TELEGRAM_BOT_TOKEN` | el token de BotFather |
| `TELEGRAM_CHAT_ID` | tu chat id |

### 4. Probarlo

*Actions → Story diaria de anime → Run workflow*. En un par de minutos te llega la story por Telegram.
Si algo falla, en esa misma pantalla aparece en rojo con el motivo.

A partir de ahí se ejecuta sola cada día a las **08:17** hora canaria (las 07:17 en invierno; en la península, una hora más).
Para cambiar la hora, edita la línea `cron` del archivo del workflow. Está en hora UTC.

---

## Personalizar (`config.json`)

| Campo | Para qué sirve |
|---|---|
| `handle` | El @ que sale abajo en la story |
| `brand` | El nombre del logo de abajo («Caba», va seguido de 神) |
| `timezone` / `timezoneLabel` | Zona horaria de las horas (`Europe/Madrid`) y cómo se nombra en la story («hora de España (península)»). Para Canarias: `Atlantic/Canary` y «hora canaria» |
| `showSpainFlag` | `true` dibuja la bandera de España junto a la hora; `false` la quita |
| `footnote` | La nota pequeña con asterisco que sale abajo |
| `platforms` | Plataformas que se muestran junto al episodio: nombre en AniList → cómo se escribe en la story. Si quitas una línea, esa plataforma deja de salir |
| `maxItems` | Cuántos animes como máximo (7 es lo que cabe cómodo) |
| `minPopularity` | Corte de popularidad en AniList. Súbelo si salen títulos muy desconocidos; bájalo si salen pocos |
| `countries` | `["JP"]` solo anime japonés. Vacío `[]` incluye donghua chino y coreano |
| `formats` | Tipos de emisión: TV, cortos (`TV_SHORT`) y web (`ONA`) |
| `colors` | Paleta del diseño |

El diseño está en `src/render.js`.

## Detalles

- El título en inglés solo aparece si existe y es distinto del romaji.
- Los episodios **1** salen marcados como **ESTRENO** y los últimos de la temporada como **FINAL**.
- Junto al episodio salen hasta 3 plataformas donde verlo, según los enlaces de streaming de AniList. AniList no indica país, así que pueden no coincidir del todo con el catálogo español; se descartan los enlaces marcados solo para Japón u otros idiomas.
- Las horas son las de **emisión en Japón** pasadas a hora de España peninsular. En Crunchyroll y otras plataformas suelen salir poco después, pero no siempre a la misma hora.
- No usa portadas ni imágenes oficiales: el diseño es tipográfico, para evitar problemas de derechos.
- Cada imagen generada también queda guardada 14 días en GitHub, en la ejecución correspondiente (*Actions → la ejecución → Artifacts*).

## Probar en tu ordenador (opcional)

```bash
npm install
npm run sample            # datos de ejemplo, para ver el diseño
npm start                 # datos reales de hoy
node src/index.js --date 2026-10-10   # un día concreto
```

La imagen queda en la carpeta `out/`.
