// Publica en Instagram la story generada por src/index.js.
// Se ejecuta en GitHub Actions después de subir el JPG a la rama pública "publico".

import { readFileSync } from 'node:fs';
import { findIgUserId, publishStory } from './instagram.js';
import { sendText } from './telegram.js';

const config = JSON.parse(readFileSync(new URL('../config.json', import.meta.url)));
const env = process.env;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const notify = async text => {
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    await sendText({ token: env.TELEGRAM_BOT_TOKEN, chatId: env.TELEGRAM_CHAT_ID, text }).catch(() => {});
  }
};

// Espera a que la imagen sea accesible públicamente (GitHub puede tardar unos segundos).
async function waitForPublicUrl(url) {
  for (let i = 0; i < 12; i++) {
    const res = await fetch(url, { method: 'HEAD' }).catch(() => null);
    if (res?.ok) return;
    await sleep(10000);
  }
  throw new Error(`La imagen no es accesible en ${url}. ¿El repositorio es público?`);
}

async function main() {
  if (config.autoPublish === false) {
    console.log('autoPublish está en false en config.json: no se publica en Instagram.');
    return;
  }
  if (!env.INSTAGRAM_ACCESS_TOKEN) {
    console.log('Falta el secreto INSTAGRAM_ACCESS_TOKEN: no se publica en Instagram.');
    return;
  }
  const latest = JSON.parse(readFileSync('out/latest.json'));
  if (latest.items === 0 && !config.publishWhenEmpty) {
    console.log('Hoy no hay episodios destacados: no se publica.');
    await notify('ℹ️ Hoy no había episodios destacados, así que no se ha publicado la story.');
    return;
  }

  const imageUrl = `${env.PUBLIC_BASE_URL}/${latest.jpg}`;
  try {
    await waitForPublicUrl(imageUrl);
    const igUserId = env.INSTAGRAM_USER_ID || await findIgUserId(env.INSTAGRAM_ACCESS_TOKEN, config.handle);
    const mediaId = await publishStory({ token: env.INSTAGRAM_ACCESS_TOKEN, igUserId, imageUrl });
    console.log(`Story publicada en Instagram (id ${mediaId}).`);
    await notify(`✅ Story publicada en Instagram (${config.handle}).`);
  } catch (err) {
    console.error(err);
    await notify(`⚠️ No se pudo publicar la story en Instagram.\n${err.message}\nLa imagen está arriba por si quieres subirla a mano.`);
    process.exit(1);
  }
}

main();
