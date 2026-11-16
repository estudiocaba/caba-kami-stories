// Genera un carrusel de @caba.kami a partir de una ficha JSON de la carpeta carruseles/.
//   node src/carrusel/index.js carruseles/2026-12-02-boticaria.json
//   node src/carrusel/index.js carruseles/… --sin-anilist   → sin internet: sin fotos ni datos de AniList
//
// 1. Busca el anime en AniList: datos y fotos oficiales (portada y personajes).
// 2. Rellena la plantilla «Entrega de anime» y la convierte en PNG de 1080×1350 con Chrome.
// 3. Guarda las diapositivas y el copy en out/carrusel-<nombre>/ y las manda por Telegram.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { fetchAnime, findCharacter, fetchCharacterByName, imageAsDataUri } from './anilist-media.js';
import { buildEntrega, buildLista } from './plantilla.js';
import { sendDocumentGroup, sendText } from '../telegram.js';

const args = process.argv.slice(2);
const specPath = args.find(a => !a.startsWith('--'));
if (!specPath) { console.error('Uso: node src/carrusel/index.js carruseles/<ficha>.json'); process.exit(1); }
const offline = args.includes('--sin-anilist');

const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';

// Sustituye {nota}, {episodios}, {estudio}, {anio} y {popularidad} por los datos de AniList.
function fillTokens(value, media) {
  const tokens = media ? {
    nota: media.averageScore != null ? `${(media.averageScore / 10).toFixed(1).replace('.', ',')} / 10` : '—',
    episodios: media.episodes ?? '—',
    estudio: media.studios?.nodes?.map(s => s.name).join(' · ') || '—',
    anio: media.seasonYear ?? '—',
    popularidad: media.popularity?.toLocaleString('es-ES') ?? '—',
    horas: media.episodes && media.duration ? Math.round(media.episodes * media.duration / 60) : '—',
  } : {};
  if (typeof value === 'string') return value.replace(/\{(\w+)\}/g, (m, k) => (k in tokens ? String(tokens[k]) : m));
  if (Array.isArray(value)) return value.map(v => fillTokens(v, media));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fillTokens(v, media)]));
  return value;
}

async function pickImage(def, media, label) {
  if (!def || !media) return null;
  let url = def.url;
  if (!url && def.de === 'portada') url = media.coverImage?.extraLarge || media.coverImage?.large;
  if (!url && def.personaje) {
    const c = findCharacter(media, def.personaje);
    if (!c) { console.warn(`  ⚠ No encontré a «${def.personaje}» en AniList`); return null; }
    url = c.image?.large;
    console.log(`  ${label}: ${c.name.full} (${c.favourites ?? '?'} favoritos en AniList)`);
  }
  if (!url) return null;
  try { return await imageAsDataUri(url); }
  catch (e) { console.warn(`  ⚠ ${e.message}`); return null; }
}

async function main() {
  const raw = JSON.parse(readFileSync(specPath, 'utf8'));
  const slug = path.basename(specPath, '.json');

  const outDir = path.resolve('out', `carrusel-${slug}`);
  mkdirSync(outDir, { recursive: true });
  const htmlPath = path.join(outDir, 'carrusel.html');
  let spec;

  if ((raw.plantilla ?? 'entrega') === 'lista') {
    // Cada elemento puede traer su anime (portada y datos) o su personaje (foto).
    const items = [];
    const imgs = [];
    for (const it of raw.items) {
      let media = null, img = null;
      if (!offline && it.anime) {
        try { media = await fetchAnime(it.anime); } catch (e) { console.warn(`  ⚠ ${e.message}`); }
      }
      if (!offline && it.personaje) {
        try {
          const c = await fetchCharacterByName(it.personaje, it.animeDelPersonaje);
          if (c) { console.log(`  ${it.personaje}: ${c.name.full} (${c.favourites} favoritos)`); img = await imageAsDataUri(c.image.large); }
        } catch (e) { console.warn(`  ⚠ ${it.personaje}: ${e.message}`); }
      } else if (media) {
        console.log(`  ${it.nombre}: ${media.title.romaji} · nota ${media.averageScore ?? '—'}`);
        img = await imageAsDataUri(media.coverImage.extraLarge || media.coverImage.large).catch(() => null);
      }
      items.push(fillTokens(it, media));
      imgs.push(img);
    }
    spec = { ...fillTokens(raw, null), items };
    const portadaImg = raw.portadaDe != null ? imgs[raw.portadaDe] : imgs[0];
    writeFileSync(htmlPath, buildLista(spec, portadaImg, imgs));
  } else {
    let media = null;
    if (!offline) {
      media = await fetchAnime(raw.anime);
      console.log(`AniList: ${media.title.romaji} (${media.seasonYear}) · nota ${media.averageScore ?? '—'} · ${media.episodes ?? '?'} eps · ${media.studios.nodes.map(s => s.name).join(', ')}`);
      console.log(`  ${media.siteUrl}`);
    }
    spec = fillTokens(raw, media);
    const imgs = {
      portada: await pickImage(spec.imagenes?.portada, media, 'Portada'),
      prota: await pickImage(spec.imagenes?.prota, media, 'Prota'),
      husbando: await pickImage(spec.imagenes?.husbando, media, 'Husbando'),
    };
    writeFileSync(htmlPath, buildEntrega(spec, imgs, media ?? { title: {} }));
  }

  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto(pathToFileURL(htmlPath).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  const slides = page.locator('.slide');
  const n = await slides.count();
  const files = [];
  for (let i = 0; i < n; i++) {
    const file = path.join(outDir, `cabakami-${slug}-${i + 1}.png`);
    await slides.nth(i).screenshot({ path: file });
    files.push(file);
  }
  await browser.close();

  const caption = `${spec.copy}\n\n${spec.hashtags}`;
  writeFileSync(path.join(outDir, 'copy.txt'), `${caption}\n\n— TEXTO ALTERNATIVO —\n${spec.alt ?? ''}\n`);
  console.log(`${n} diapositivas en ${outDir}`);

  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID && !args.includes('--sin-telegram')) {
    await sendDocumentGroup({
      token: TELEGRAM_BOT_TOKEN, chatId: TELEGRAM_CHAT_ID,
      files: files.map(f => ({ name: path.basename(f), data: readFileSync(f) })),
      caption: `Carrusel listo para revisar ✨ ${spec.pieza} (${spec.fecha})`,
    });
    await sendText({ token: TELEGRAM_BOT_TOKEN, chatId: TELEGRAM_CHAT_ID, text: caption });
    console.log('Enviado por Telegram');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
