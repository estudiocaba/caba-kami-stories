// Genera un reel de @caba.kami a partir de una ficha JSON de la carpeta reeles/.
//   node src/reel/index.js reeles/2026-12-06-moods.json
//   node src/reel/index.js reeles/… --sin-anilist --sin-telegram
//
// 1. Busca en AniList las fotos y datos de cada elemento.
// 2. Monta la animación con la plantilla y la graba fotograma a fotograma con Chrome (30 fps).
// 3. Une los fotogramas en un MP4 vertical 1080×1920 con ffmpeg, con una pista de lofi propio
//    (carpeta musica/), y lo manda por Telegram.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { fetchAnime, fetchCharacterByName, imageAsDataUri } from '../carrusel/anilist-media.js';
import { buildReelLista, PULSOS } from './plantilla.js';
import { renderSfx } from './sfx.js';
import { sendText } from '../telegram.js';

const args = process.argv.slice(2);
const specPath = args.find(a => !a.startsWith('--'));
if (!specPath) { console.error('Uso: node src/reel/index.js reeles/<ficha>.json'); process.exit(1); }
const offline = args.includes('--sin-anilist');
// --datos <archivo>: reutiliza datos e imágenes guardados de una generación anterior (datos.json).
const datosPath = args.includes('--datos') ? args[args.indexOf('--datos') + 1] : null;
const FPS = 30;
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';

function fillTokens(value, media) {
  const tokens = media ? {
    nota: media.averageScore != null ? `${(media.averageScore / 10).toFixed(1).replace('.', ',')}/10` : '—',
    episodios: media.episodes ?? '—',
    estudio: media.studios?.nodes?.map(s => s.name).join(' · ') || '—',
    anio: media.seasonYear ?? '—',
    horas: media.episodes && media.duration ? Math.round(media.episodes * media.duration / 60) : '—',
  } : {};
  if (typeof value === 'string') return value.replace(/\{(\w+)\}/g, (m, k) => (k in tokens ? String(tokens[k]) : m));
  if (Array.isArray(value)) return value.map(v => fillTokens(v, media));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fillTokens(v, media)]));
  return value;
}

async function main() {
  const raw = JSON.parse(readFileSync(specPath, 'utf8'));
  const slug = path.basename(specPath, '.json');
  const guardado = datosPath ? JSON.parse(readFileSync(datosPath, 'utf8')) : null;
  const items = guardado?.items ?? [], imgs = guardado?.imgs ?? [];
  for (const it of guardado ? [] : raw.items) {
    let media = null, img = null;
    if (!offline && it.anime) {
      try { media = await fetchAnime(it.anime); console.log(`  ${it.nombre}: ${media.title.romaji} · nota ${media.averageScore ?? '—'}`); }
      catch (e) { console.warn(`  ⚠ ${e.message}`); }
    }
    if (!offline && it.personaje) {
      const c = await fetchCharacterByName(it.personaje, it.animeDelPersonaje).catch(() => null);
      if (c) img = await imageAsDataUri(c.image.large).catch(() => null);
    } else if (media) {
      img = await imageAsDataUri(media.coverImage.extraLarge || media.coverImage.large).catch(() => null);
    }
    const lleno = fillTokens(it, media);
    // Cifras que cuentan hacia arriba en el vídeo.
    if (media && it.dato) {
      lleno.datoHtml = it.dato
        .replace('{nota}', media.averageScore != null ? `<span data-count="${(media.averageScore / 10).toFixed(1)}" data-dec="1">0</span>/10` : '—')
        .replace('{episodios}', media.episodes != null ? `<span data-count="${media.episodes}">0</span>` : '—')
        .replace('{horas}', media.episodes && media.duration ? `<span data-count="${Math.round(media.episodes * media.duration / 60)}">0</span>` : '—')
        .replace(/\{(\w+)\}/g, (m, k) => fillTokens(m, media));
    }
    if (media?.title?.native) lleno.nativo = media.title.native;
    items.push(lleno);
    imgs.push(img);
  }
  const spec = { ...raw, items };

  // Música: lofi oscuro propio (musica/*.m4a, compuesto por musica/componer.py, sin derechos de terceros).
  // La ficha puede elegir pista con "musica"; si no, se elige una fija según el nombre de la ficha.
  // El montaje se cuenta en pulsos de esa pista para que los cortes caigan en el golpe.
  const BPM = { medianoche: 72, 'luna-roja': 68, niebla: 76, vela: 70 };
  const pista = spec.musica ?? Object.keys(BPM)[[...slug].reduce((a, c) => a + c.charCodeAt(0), 0) % 4];
  const bpm = BPM[pista] ?? 72;

  const outDir = path.resolve('out', `reel-${slug}`);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, 'datos.json'), JSON.stringify({ items, imgs }));
  const frames = path.join(outDir, 'frames');
  rmSync(frames, { recursive: true, force: true });
  mkdirSync(frames, { recursive: true });
  const htmlPath = path.join(outDir, 'reel.html');
  const { html, eventos, cortes, duracion: dur } = buildReelLista(spec, imgs, bpm);
  writeFileSync(htmlPath, html);

  const n = Math.round(dur * FPS);
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto(pathToFileURL(htmlPath).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  const reel = page.locator('.reel');
  for (let f = 0; f < n; f++) {
    await page.evaluate(t => window.render(t), f / FPS);
    await reel.screenshot({ path: path.join(frames, `${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 88 });
  }
  // Portada del reel: el fotograma del primer elemento ya visible.
  await page.evaluate(t => window.render(t), (PULSOS.intro + 3) * 60 / bpm);
  await reel.screenshot({ path: path.join(outDir, `cabakami-${slug}-portada.jpg`), type: 'jpeg', quality: 92 });
  await browser.close();

  // Efectos de sonido sincronizados con el motion graphics.
  const wav = path.join(outDir, 'efectos.wav');
  writeFileSync(wav, renderSfx(eventos, dur));
  // Mezcla: música con fundidos que baja en cada corte (como si la cinta tropezara) + efectos.
  const audio = path.resolve('musica', `${pista}.m4a`);
  const duck = cortes.map(c => `between(t,${(c - .2).toFixed(2)},${(c + .2).toFixed(2)})`).join('+') || '0';
  const mp4 = path.join(outDir, `cabakami-${slug}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frames, '%05d.jpg'),
    '-stream_loop', '-1', '-i', audio, '-i', wav,
    '-filter_complex',
    `[1:a]atrim=0:${dur.toFixed(2)},asetpts=PTS-STARTPTS,afade=t=in:d=0.4,afade=t=out:st=${(dur - 1.6).toFixed(2)}:d=1.6,volume='1-0.6*(${duck})':eval=frame[m];` +
    `[2:a]aformat=channel_layouts=stereo,volume=1.1[s];[m][s]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[a]`,
    '-map', '0:v', '-map', '[a]', '-t', dur.toFixed(2),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', mp4]);
  console.log(`Música: ${pista}`);
  rmSync(frames, { recursive: true, force: true });

  const caption = `${spec.copy}\n\n${spec.hashtags}`;
  writeFileSync(path.join(outDir, 'copy.txt'), `${caption}\n\n— AUDIO —\nLofi propio de caba.kami: ${pista}\n`);
  console.log(`Reel de ${dur.toFixed(1)} s en ${mp4}`);

  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID && !args.includes('--sin-telegram')) {
    const form = new FormData();
    form.append('chat_id', TELEGRAM_CHAT_ID);
    form.append('video', new Blob([readFileSync(mp4)], { type: 'video/mp4' }), path.basename(mp4));
    form.append('caption', `Reel listo para revisar ✨ ${spec.pieza} (${spec.fecha})`.slice(0, 1000));
    form.append('supports_streaming', 'true');
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`Telegram respondió ${res.status}: ${await res.text()}`);
    await sendText({ token: TELEGRAM_BOT_TOKEN, chatId: TELEGRAM_CHAT_ID, text: `${caption}\n\n🎵 Lofi propio: ${pista}` });
    console.log('Enviado por Telegram');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
