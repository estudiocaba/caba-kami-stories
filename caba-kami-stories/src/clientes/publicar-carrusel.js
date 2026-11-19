// Publica en Instagram un carrusel de cliente ya generado (JPG en la rama "publico").
//   node src/clientes/publicar-carrusel.js <cuenta> <ficha>
// Las credenciales salen de los secretos de GitHub que nombra marca.json → "instagram" (el workflow
// los pasa en SECRETOS). Solo lo lanza La Mensajera, y solo con piezas en «Programado».

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { graph } from '../instagram.js';
import { sendText } from '../telegram.js';
import { cargarMarca } from './marca.js';

const env = process.env;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const [cuenta, nombre] = process.argv.slice(2);
const avisar = t => (env.TELEGRAM_BOT_TOKEN ? sendText({ token: env.TELEGRAM_BOT_TOKEN, chatId: env.TELEGRAM_CHAT_ID, text: t }).catch(() => {}) : null);

async function esperar(id, token) {
  for (let i = 0; i < 24; i++) {
    const st = await graph('GET', `/${id}`, { fields: 'status_code,status' }, token);
    if (st.status_code === 'FINISHED') return;
    if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') throw new Error(`Instagram no pudo procesar ${id}: ${st.status ?? st.status_code}`);
    await sleep(10000);
  }
  throw new Error(`Instagram tardó demasiado en procesar ${id}`);
}

try {
  const { marca, dir } = cargarMarca(cuenta);
  const ficha = JSON.parse(readFileSync(path.join(dir, 'carruseles', `${nombre}.json`), 'utf8'));
  const secretos = JSON.parse(env.SECRETOS || '{}');
  const token = secretos[marca.instagram?.secretoToken ?? ''], igUserId = secretos[marca.instagram?.secretoUsuario ?? ''];
  if (!token || !igUserId) throw new Error(`faltan los secretos de Instagram de ${marca.nombre}`);
  const urls = [];
  for (let i = 1; i <= 10; i++) {
    const url = `${env.PUBLIC_BASE_URL}/clientes/${cuenta}/carruseles/${nombre}/${cuenta}-${nombre}-${i}.jpg`;
    if (!(await fetch(url, { method: 'HEAD' }).catch(() => null))?.ok) break;
    urls.push(url);
  }
  if (!urls.length) throw new Error(`no encuentro las diapositivas de ${nombre} en la rama publico`);
  const caption = `${ficha.copy}\n\n${ficha.hashtags}`.slice(0, 2200);
  let c;
  if (urls.length === 1) {
    // post de una sola imagen (por ejemplo, el de sorteo extraordinario de la lotería)
    c = await graph('POST', `/${igUserId}/media`, { image_url: urls[0], caption }, token);
  } else {
    const hijos = [];
    for (const url of urls) hijos.push((await graph('POST', `/${igUserId}/media`, { image_url: url, is_carousel_item: 'true' }, token)).id);
    for (const id of hijos) await esperar(id, token);
    c = await graph('POST', `/${igUserId}/media`, { media_type: 'CAROUSEL', children: hijos.join(','), caption }, token);
  }
  await esperar(c.id, token);
  const pub = await graph('POST', `/${igUserId}/media_publish`, { creation_id: c.id }, token);
  const info = await graph('GET', `/${pub.id}`, { fields: 'permalink' }, token).catch(() => ({}));
  console.log(`Publicado: ${pub.id} ${info.permalink ?? ''}`);
  await avisar(`✅ ${marca.nombre}: carrusel publicado (${ficha.pieza}).${info.permalink ? `\n${info.permalink}` : ''}`);
} catch (e) {
  console.error(e);
  await avisar(`⚠️ No se pudo publicar el carrusel ${cuenta}/${nombre}: ${e.message}`);
  process.exit(1);
}
