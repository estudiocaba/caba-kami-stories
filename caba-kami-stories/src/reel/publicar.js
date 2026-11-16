// Publica en Instagram un reel ya generado (el MP4 está en la rama "publico", carpeta reeles/<ficha>/).
//   node src/reel/publicar.js reeles/2026-12-06-moods.json
// Instagram descarga el vídeo desde su URL pública, lo procesa (puede tardar unos minutos) y se publica.
// El reel lleva su propia música (lofi original de la carpeta musica/).

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

async function main() {
  if (!specPath) throw new Error('Uso: node src/reel/publicar.js reeles/<ficha>.json');
  if (!env.INSTAGRAM_ACCESS_TOKEN) throw new Error('Falta el secreto INSTAGRAM_ACCESS_TOKEN.');
  const spec = JSON.parse(readFileSync(specPath, 'utf8'));
  const slug = path.basename(specPath, '.json');
  const token = env.INSTAGRAM_ACCESS_TOKEN;
  const videoUrl = `${env.PUBLIC_BASE_URL}/reeles/${slug}/cabakami-${slug}.mp4`;
  const coverUrl = `${env.PUBLIC_BASE_URL}/reeles/${slug}/cabakami-${slug}-portada.jpg`;

  const head = await fetch(videoUrl, { method: 'HEAD' }).catch(() => null);
  if (!head?.ok) throw new Error(`No encontré el vídeo de ${slug} en la rama publico. Genera el reel antes de publicarlo.`);

  const igUserId = env.INSTAGRAM_USER_ID || await findIgUserId(token, config.handle);
  const container = await graph('POST', `/${igUserId}/media`, {
    media_type: 'REELS', video_url: videoUrl, cover_url: coverUrl,
    caption: `${spec.copy}\n\n${spec.hashtags}`.slice(0, 2200), share_to_feed: 'true',
  }, token);

  for (let i = 0; i < 60; i++) {
    const st = await graph('GET', `/${container.id}`, { fields: 'status_code,status' }, token);
    if (st.status_code === 'FINISHED') break;
    if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') throw new Error(`Instagram no pudo procesar el vídeo: ${st.status ?? st.status_code}`);
    await sleep(10000);
  }
  const published = await graph('POST', `/${igUserId}/media_publish`, { creation_id: container.id }, token);
  const info = await graph('GET', `/${published.id}`, { fields: 'permalink' }, token).catch(() => ({}));
  console.log(`Publicado: ${published.id} ${info.permalink ?? ''}`);
  await notify(`✅ Reel publicado en Instagram: ${spec.pieza}${info.permalink ? `\n${info.permalink}` : ''}`);
}

main().catch(async err => {
  console.error(err);
  await notify(`⚠️ No se pudo publicar el reel «${specPath}».\n${err.message}`);
  process.exit(1);
});
