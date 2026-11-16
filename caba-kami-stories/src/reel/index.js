// Genera un reel de @caba.kami a partir de una ficha JSON de la carpeta reeles/.
//   node src/reel/index.js reeles/2026-12-06-moods.json
//   node src/reel/index.js reeles/… --sin-anilist --sin-telegram
//
// 1. Busca en AniList las fotos y datos de cada elemento.
// 2. Monta la animación con la plantilla y la graba fotograma a fotograma con Chrome (30 fps).
// 3. Une los fotogramas en un MP4 vertical 1080×1920 con ffmpeg (con pista de audio en silencio:
//    la música se elige en Instagram) y lo manda por Telegram.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { fetchAnime, fetchCharacterByName, imageAsDataUri } from '../carrusel/anilist-media.js';
import { buildReelLista, duracionLista } from './plantilla.js';
import { sendText } from '../telegram.js';

const args = process.argv.slice(2);
const specPath = args.find(a => !a.startsWith('--'));
if (!specPath) { console.error('Uso: node src/reel/index.js reeles/<ficha>.json'); process.exit(1); }
const offline = args.includes('--sin-anilist');
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
  const items = [], imgs = [];
  for (const it of raw.items) {
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
    items.push(fillTokens(it, media));
    imgs.push(img);
  }
  const spec = { ...raw, items };

  const outDir = path.resolve('out', `reel-${slug}`);
  const frames = path.join(outDir, 'frames');
  rmSync(frames, { recursive: true, force: true });
  mkdirSync(frames, { recursive: true });
  const htmlPath = path.join(outDir, 'reel.html');
  writeFileSync(htmlPath, buildReelLista(spec, imgs));

  const dur = duracionLista(spec);
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
  await page.evaluate(t => window.render(t), (spec.intro ?? 2.6) + 1.6);
  await reel.screenshot({ path: path.join(outDir, `cabakami-${slug}-portada.jpg`), type: 'jpeg', quality: 92 });
  await browser.close();

  const mp4 = path.join(outDir, `cabakami-${slug}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frames, '%05d.jpg'),
    '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-shortest',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', mp4]);
  rmSync(frames, { recursive: true, force: true });

  const caption = `${spec.copy}\n\n${spec.hashtags}`;
  writeFileSync(path.join(outDir, 'copy.txt'), `${caption}\n\n— AUDIO —\n${spec.audio ?? 'Elegir un audio en tendencia al publicar.'}\n`);
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
    await sendText({ token: TELEGRAM_BOT_TOKEN, chatId: TELEGRAM_CHAT_ID, text: `${caption}\n\n🎵 ${spec.audio ?? 'Elige un audio en tendencia al publicar.'}` });
    console.log('Enviado por Telegram');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
