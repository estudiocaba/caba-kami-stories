// Genera las stories de un cliente a partir de su semana (clientes/<cuenta>/stories/<lunes>.json).
//   node src/stories/index.js <cuenta>                         → la semana más reciente
//   node src/stories/index.js <cuenta> --semana 2026-12-07     → una semana concreta
//   node src/stories/index.js <cuenta> --fecha 2026-12-09      → solo ese día
//   --sin-telegram  no las manda a revisar
// Deja las imágenes en out/stories/<cuenta>/<fecha>.jpg y un resumen en out/stories/<cuenta>/semana.json.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { htmlStory, resolverFotos } from './plantillas.js';
import { sendDocumentGroup, sendText } from '../telegram.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const cuenta = args.find(a => !a.startsWith('--'));
const opt = k => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
if (!cuenta) { console.error('Uso: node src/stories/index.js <cuenta> [--semana AAAA-MM-DD] [--fecha AAAA-MM-DD]'); process.exit(1); }

const dirCliente = path.join(RAIZ, 'clientes', cuenta);
const marca = JSON.parse(readFileSync(path.join(dirCliente, 'marca.json'), 'utf8'));
if (marca.logo && !/^(https?:|data:)/.test(marca.logo)) {
  const f = path.join(dirCliente, marca.logo);
  marca.logo = `data:image/${path.extname(f).slice(1).replace('jpg', 'jpeg').replace('svg', 'svg+xml')};base64,${readFileSync(f).toString('base64')}`;
}

const dirSemanas = path.join(dirCliente, 'stories');
const semanas = existsSync(dirSemanas) ? readdirSync(dirSemanas).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort() : [];
const fecha = opt('--fecha');
let archivo = opt('--semana') ? `${opt('--semana')}.json` : semanas.at(-1);
if (fecha) archivo = semanas.filter(f => f.slice(0, 10) <= fecha).at(-1);
if (!archivo) { console.log(`${cuenta}: no hay semanas de stories.`); process.exit(0); }
const semana = JSON.parse(readFileSync(path.join(dirSemanas, archivo), 'utf8'));
const stories = semana.stories.filter(s => !fecha || s.fecha === fecha);

const OUT = path.join(RAIZ, 'out', 'stories', cuenta);
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const hechas = [];
for (const s of stories) {
  const html = resolverFotos(htmlStory(s, marca), dirCliente);
  const tmp = path.join(OUT, `${s.fecha}.html`);
  writeFileSync(tmp, html);
  await page.goto('file://' + tmp, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const jpg = path.join(OUT, `${cuenta}-story-${s.fecha}.jpg`);
  await page.locator('.story').screenshot({ path: jpg, type: 'jpeg', quality: 92 });
  hechas.push({ fecha: s.fecha, plantilla: s.plantilla, jpg: path.basename(jpg) });
  console.log(`  ${s.fecha} · ${s.plantilla}`);
}
await browser.close();
writeFileSync(path.join(OUT, 'semana.json'), JSON.stringify({ cuenta, semana: archivo.slice(0, 10), stories: hechas }, null, 2));

const env = process.env;
if (!args.includes('--sin-telegram') && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID && hechas.length) {
  const dias = d => new Date(d + 'T12:00:00Z').toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  for (let i = 0; i < hechas.length; i += 10) {
    const lote = hechas.slice(i, i + 10);
    await sendDocumentGroup({ token: env.TELEGRAM_BOT_TOKEN, chatId: env.TELEGRAM_CHAT_ID,
      files: lote.map(h => ({ name: h.jpg, data: readFileSync(path.join(OUT, h.jpg)) })),
      caption: `Stories de ${marca.nombre} para revisar:\n${lote.map(h => `· ${dias(h.fecha)}: ${h.plantilla}`).join('\n')}\n\nSe publican solas las que marques como «Programado» en Notion.` });
  }
  console.log('Enviadas por Telegram');
} else if (!hechas.length) {
  await (env.TELEGRAM_BOT_TOKEN ? sendText({ token: env.TELEGRAM_BOT_TOKEN, chatId: env.TELEGRAM_CHAT_ID, text: `${cuenta}: no había stories para generar.` }).catch(() => {}) : null);
}
