// Publica en Instagram un carrusel ya generado (las diapositivas JPG están en la rama "publico").
//   node src/carrusel/publicar.js carruseles/2026-12-02-boticaria.json
//
// 1. Crea un contenedor por diapositiva (is_carousel_item) a partir de su URL pública.
// 2. Crea el contenedor del carrusel con el copy y los hashtags.
// 3. Espera a que Instagram lo procese y lo publica. Avisa por Telegram.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { graph, findIgUserId } from '../instagram.js';
import { sendText } from '../telegram.js';

const config = JSON.parse(readFileSync(new URL('../../config.json', import.meta.url)));
const env = process.env;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const specPath = process.argv[2];

const notify = async text => {
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    await sendText({ token: env.TELEGRAM_BOT_TOKEN, chatId: env.TELEGRAM_CHAT_ID, text }).catch(() => {});
  }
};

async function waitFinished(id, token) {
  for (let i = 0; i < 24; i++) {
    const st = await graph('GET', `/${id}`, { fields: 'status_code,status' }, token);
    if (st.status_code === 'FINISHED') return;
    if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') throw new Error(`Instagram no pudo procesar ${id}: ${st.status ?? st.status_code}`);
    await sleep(Number(env.POLL_MS ?? 10000));
  }
  throw new Error(`Instagram tardó demasiado en procesar ${id}`);
}

// Busca las diapositivas publicadas en la rama "publico": -1.jpg, -2.jpg… hasta que una no exista.
async function slideUrls(slug) {
  const urls = [];
  for (let i = 1; i <= 20; i++) {
    const url = `${env.PUBLIC_BASE_URL}/carruseles/${slug}/cabakami-${slug}-${i}.jpg`;
    const res = await fetch(url, { method: 'HEAD' }).catch(() => null);
    if (!res?.ok) break;
    urls.push(url);
  }
  return urls;
}

async function main() {
  if (!specPath) throw new Error('Uso: node src/carrusel/publicar.js carruseles/<ficha>.json');
  if (!env.INSTAGRAM_ACCESS_TOKEN) throw new Error('Falta el secreto INSTAGRAM_ACCESS_TOKEN.');
  const spec = JSON.parse(readFileSync(specPath, 'utf8'));
  const slug = path.basename(specPath, '.json');
  const token = env.INSTAGRAM_ACCESS_TOKEN;
  const caption = `${spec.copy}\n\n${spec.hashtags}`.slice(0, 2200);

  const urls = await slideUrls(slug);
  if (urls.length < 2) throw new Error(`No encontré las diapositivas JPG de ${slug} en la rama publico. Genera el carrusel antes de publicarlo.`);
  if (urls.length > 10) urls.length = 10; // límite de Instagram para carruseles por API
  console.log(`${urls.length} diapositivas para ${slug}`);

  const igUserId = env.INSTAGRAM_USER_ID || await findIgUserId(token, config.handle);
  const children = [];
  for (const url of urls) {
    const c = await graph('POST', `/${igUserId}/media`, { image_url: url, is_carousel_item: 'true' }, token);
    children.push(c.id);
  }
  for (const id of children) await waitFinished(id, token);

  const carousel = await graph('POST', `/${igUserId}/media`, {
    media_type: 'CAROUSEL', children: children.join(','), caption,
  }, token);
  await waitFinished(carousel.id, token);
  const published = await graph('POST', `/${igUserId}/media_publish`, { creation_id: carousel.id }, token);
  const info = await graph('GET', `/${published.id}`, { fields: 'permalink' }, token).catch(() => ({}));
  console.log(`Publicado: ${published.id} ${info.permalink ?? ''}`);
  await notify(`✅ Carrusel publicado en Instagram: ${spec.pieza}${info.permalink ? `\n${info.permalink}` : ''}`);
}

main().catch(async err => {
  console.error(err);
  await notify(`⚠️ No se pudo publicar el carrusel «${specPath}».\n${err.message}`);
  process.exit(1);
});
