// Genera las stories de un cliente a partir de su semana (clientes/<cuenta>/stories/<lunes>.json).
//   node src/stories/index.js <cuenta>                         → la semana más reciente
//   node src/stories/index.js <cuenta> --semana 2026-12-07     → una semana concreta
//   node src/stories/index.js <cuenta> --fecha 2026-12-09      → solo ese día
//   --sin-telegram  no las manda a revisar
//
// Si la marca tiene "stories": {"video": true}, cada story sale en video (MP4 de 1080×1920) con
// animación de entrada, transición de salida y música propia (musica/, ver LICENCIAS.md); si no, en JPG.
// Antes de generar nada revisa las reglas del cliente (marca.json → plantillas y reglas): si una story
// las incumple, se para y dice por qué.
// Deja los archivos en out/stories/<cuenta>/ y un resumen en out/stories/<cuenta>/semana.json.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { htmlStory, htmlStoryEditorial } from './plantillas.js';
import { resolverFotos } from '../clientes/fotos.js';
import { cargarMarca, fotoSrc, revisar, RAIZ } from '../clientes/marca.js';
import { sendDocumentGroup, sendText } from '../telegram.js';

const args = process.argv.slice(2);
const cuenta = args.find(a => !a.startsWith('--'));
const opt = k => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
if (!cuenta) { console.error('Uso: node src/stories/index.js <cuenta> [--semana AAAA-MM-DD] [--fecha AAAA-MM-DD]'); process.exit(1); }

const { marca, dir: dirCliente } = cargarMarca(cuenta);
const dirSemanas = path.join(dirCliente, 'stories');
const semanas = existsSync(dirSemanas) ? readdirSync(dirSemanas).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort() : [];
const fecha = opt('--fecha');
let archivo = opt('--semana') ? `${opt('--semana')}.json` : semanas.at(-1);
if (fecha) archivo = semanas.filter(f => f.slice(0, 10) <= fecha).at(-1);
if (!archivo) { console.log(`${cuenta}: no hay semanas de stories.`); process.exit(0); }
const semana = JSON.parse(readFileSync(path.join(dirSemanas, archivo), 'utf8'));
const stories = semana.stories.filter(s => !fecha || s.fecha === fecha);

const fallos = stories.flatMap(s => revisar(s, marca).map(f => `${s.fecha}: ${f}`));
if (fallos.length) {
  console.error(`Las stories de ${marca.nombre} no cumplen sus reglas:\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}

const video = marca.stories?.video ? (marca.stories.duracion ?? 8) : 0;
const FPS = 30;
const OUT = path.join(RAIZ, 'out', 'stories', cuenta);
mkdirSync(OUT, { recursive: true });

// Música: una pista propia por día (rota entre las de la marca) y un tramo distinto cada vez.
function musica(fechaStory) {
  const pistas = marca.musica ?? ['brillo', 'seda', 'verano'];
  const dia = Math.round(new Date(fechaStory) / 864e5);
  const pista = path.join(RAIZ, 'musica', `${pistas[dia % pistas.length]}.m4a`);
  const largo = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', pista]).toString());
  const inicio = ((dia * 7.37) % Math.max(1, largo - video - 2)).toFixed(2);
  return { pista, inicio };
}

// Fotos de internet (estilo editorial): se buscan y se fijan antes de generar
const creditos = {};
for (const s of stories) {
  const dirFotos = path.join(OUT, `fotos-${s.fecha}`); mkdirSync(dirFotos, { recursive: true });
  const r = await resolverFotos(s, dirFotos);
  if (r.textoCreditos) creditos[s.fecha] = r.textoCreditos;
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const hechas = [];
for (const s of stories) {
  const html = (marca.estilo === 'editorial' ? htmlStoryEditorial : htmlStory)(s, marca, video).replace(/data-foto="([^"]*)"/g, (_, ref) => (ref ? `style="background-image:url('${fotoSrc(ref, dirCliente)}')"` : ''))
    .replace(/url\('(fotos\/[^']+)'\)/g, (_, ref) => `url('${fotoSrc(ref, dirCliente)}')`);
  const tmp = path.join(OUT, `${s.fecha}.html`);
  writeFileSync(tmp, html);
  await page.goto('file://' + tmp, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const base = path.join(OUT, `${cuenta}-story-${s.fecha}`);
  const story = page.locator('.story');
  if (!video) {
    await story.screenshot({ path: `${base}.jpg`, type: 'jpeg', quality: 92 });
    hechas.push({ fecha: s.fecha, plantilla: s.plantilla, archivo: path.basename(`${base}.jpg`), creditos: creditos[s.fecha] });
  } else {
    const frames = path.join(OUT, `frames-${s.fecha}`);
    rmSync(frames, { recursive: true, force: true }); mkdirSync(frames);
    const n = Math.round(video * FPS);
    for (let i = 0; i < n; i++) {
      await page.evaluate(ms => window.irA(ms), (i / FPS) * 1000);
      await story.screenshot({ path: path.join(frames, `${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 88 });
    }
    // portada estática (el momento en que ya está todo en pantalla), para Telegram y como respaldo
    await page.evaluate(ms => window.irA(ms), Math.min(video * 1000 - 700, 3200));
    await story.screenshot({ path: `${base}.jpg`, type: 'jpeg', quality: 92 });
    const { pista, inicio } = musica(s.fecha);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frames, '%04d.jpg'),
      '-ss', inicio, '-i', pista, '-filter_complex', `[1:a]afade=t=in:d=0.4,afade=t=out:st=${video - 0.8}:d=0.8,volume=0.85[a]`,
      '-map', '0:v', '-map', '[a]', '-t', String(video), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', `${base}.mp4`]);
    rmSync(frames, { recursive: true, force: true });
    hechas.push({ fecha: s.fecha, plantilla: s.plantilla, archivo: path.basename(`${base}.mp4`), portada: path.basename(`${base}.jpg`), creditos: creditos[s.fecha] });
  }
  console.log(`  ${s.fecha} · ${s.plantilla}${video ? ' · video' : ''}`);
}
await browser.close();
writeFileSync(path.join(OUT, 'semana.json'), JSON.stringify({ cuenta, semana: archivo.slice(0, 10), video: !!video, stories: hechas }, null, 2));

const env = process.env;
const api = env.TELEGRAM_BOT_TOKEN && `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;
const dias = d => new Date(d + 'T12:00:00Z').toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
if (!args.includes('--sin-telegram') && api && env.TELEGRAM_CHAT_ID && hechas.length) {
  const pie = `Stories de ${marca.nombre} para revisar:\n${hechas.map(h => `· ${dias(h.fecha)}: ${h.plantilla}`).join('\n')}\n\nSe publican solas las que marques como «Programado» en Notion.`;
  if (video) {
    for (const [i, h] of hechas.entries()) {   // los videos de uno en uno, para verlos con sonido
      const form = new FormData();
      form.append('chat_id', env.TELEGRAM_CHAT_ID);
      form.append('video', new Blob([readFileSync(path.join(OUT, h.archivo))], { type: 'video/mp4' }), h.archivo);
      form.append('width', '1080'); form.append('height', '1920'); form.append('duration', String(video)); form.append('supports_streaming', 'true');
      form.append('caption', `${marca.nombre} · ${dias(h.fecha)} · ${h.plantilla}${i === hechas.length - 1 ? `\n\n${pie}` : ''}`.slice(0, 1000));
      const r = await fetch(`${api}/sendVideo`, { method: 'POST', body: form });
      if (!r.ok) console.log(`Telegram: ${r.status} ${await r.text()}`);
    }
  } else {
    for (let i = 0; i < hechas.length; i += 10) {
      const lote = hechas.slice(i, i + 10);
      await sendDocumentGroup({ token: env.TELEGRAM_BOT_TOKEN, chatId: env.TELEGRAM_CHAT_ID,
        files: lote.map(h => ({ name: h.archivo, data: readFileSync(path.join(OUT, h.archivo)) })), caption: pie });
    }
  }
  console.log('Enviadas por Telegram');
} else if (!hechas.length && api) {
  await sendText({ token: env.TELEGRAM_BOT_TOKEN, chatId: env.TELEGRAM_CHAT_ID, text: `${cuenta}: no había stories para generar.` }).catch(() => {});
}
