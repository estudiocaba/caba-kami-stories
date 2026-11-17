// Publica las stories del día de todos los clientes, solo las aprobadas.
//   node src/stories/publicar.js <carpeta de la rama publico> [--fecha AAAA-MM-DD]
//
// La aprobación la deja La Mensajera: cada tarde, por cada story en «Programado» en Notion para el día
// siguiente, añade la fecha a stories/<cuenta>/aprobadas.txt en la rama publico. Este script publica
// las de hoy que estén aprobadas y aún no publicadas, y las anota en stories/<cuenta>/publicadas.txt.
// Sin aprobación no se publica nada.
//
// Credenciales de cada cliente: secretos de GitHub con el nombre que diga su marca.json
// ("instagram": {"secretoToken": "...", "secretoUsuario": "..."}); el workflow los pasa en SECRETOS.

import { readFileSync, appendFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishStory } from '../instagram.js';
import { sendText } from '../telegram.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const [publico] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const args = process.argv.slice(2);
const env = process.env;
const secretos = JSON.parse(env.SECRETOS || '{}');
const hoy = args.includes('--fecha') ? args[args.indexOf('--fecha') + 1]
  : new Date().toLocaleDateString('sv', { timeZone: 'Atlantic/Canary' });
const base = env.PUBLIC_BASE_URL;
const lineas = f => (existsSync(f) ? readFileSync(f, 'utf8').split('\n').map(l => l.trim()).filter(Boolean) : []);
const avisar = t => (env.TELEGRAM_BOT_TOKEN ? sendText({ token: env.TELEGRAM_BOT_TOKEN, chatId: env.TELEGRAM_CHAT_ID, text: t }).catch(() => {}) : null);

const clientes = readdirSync(path.join(RAIZ, 'clientes'), { withFileTypes: true }).filter(d => d.isDirectory()
  && existsSync(path.join(RAIZ, 'clientes', d.name, 'marca.json'))).map(d => d.name);

for (const cuenta of clientes) {
  const marca = JSON.parse(readFileSync(path.join(RAIZ, 'clientes', cuenta, 'marca.json'), 'utf8'));
  if (!marca.stories?.activo) continue;
  const dir = path.join(publico, 'stories', cuenta);
  if (!lineas(path.join(dir, 'aprobadas.txt')).includes(hoy)) { console.log(`${cuenta}: la story de hoy no está aprobada.`); continue; }
  if (lineas(path.join(dir, 'publicadas.txt')).includes(hoy)) { console.log(`${cuenta}: ya publicada.`); continue; }
  const jpg = `${cuenta}-story-${hoy}.jpg`, mp4 = `${cuenta}-story-${hoy}.mp4`;
  const esVideo = existsSync(path.join(dir, mp4));
  if (!esVideo && !existsSync(path.join(dir, jpg))) { await avisar(`⚠️ ${marca.nombre}: la story de hoy está aprobada pero no encuentro el archivo.`); continue; }
  const token = secretos[marca.instagram?.secretoToken ?? ''];
  const igUserId = secretos[marca.instagram?.secretoUsuario ?? ''];
  if (!token || !igUserId) { await avisar(`⚠️ ${marca.nombre}: faltan los secretos de Instagram, no se publicó la story.`); continue; }
  try {
    const id = await publishStory({ token, igUserId, ...(esVideo ? { videoUrl: `${base}/stories/${cuenta}/${mp4}` } : { imageUrl: `${base}/stories/${cuenta}/${jpg}` }) });
    appendFileSync(path.join(dir, 'publicadas.txt'), `${hoy}\n`);
    console.log(`${cuenta}: story publicada (${id}).`);
    await avisar(`✅ Story de ${marca.nombre} publicada.`);
  } catch (e) {
    console.log(`${cuenta}: ${e.message}`);
    await avisar(`❌ Story de ${marca.nombre}: ${e.message}`);
  }
}
