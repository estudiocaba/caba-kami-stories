// Punto de entrada: genera la story del día y la manda por Telegram.
//   node src/index.js                  → hoy, datos reales de AniList
//   node src/index.js --date 2026-10-08
//   node src/index.js --sample         → datos de ejemplo (para probar el diseño)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fetchAiring, todayIn } from './anilist.js';
import { renderStory, buildCaption } from './render.js';
import { sendToTelegram } from './telegram.js';

const config = JSON.parse(readFileSync(new URL('../config.json', import.meta.url)));
const args = process.argv.slice(2);
const arg = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };

async function main() {
const ymd = arg('--date') || todayIn(config.timezone);
const useSample = args.includes('--sample');

const items = useSample
  ? JSON.parse(readFileSync(new URL('../sample.json', import.meta.url))).map((it, i) => ({
      ...it, airingAt: Math.floor(new Date(`${ymd}T00:00:00Z`).getTime() / 1000) + it.minutesFromMidnightUTC * 60,
    }))
  : await fetchAiring(ymd, config);

console.log(`${ymd}: ${items.length} episodios seleccionados`);
items.forEach(i => console.log(' -', i.title, 'ep', i.episode));

const png = await renderStory(items, ymd, config);
const caption = buildCaption(items, ymd, config);

mkdirSync('out', { recursive: true });
const filename = `story-anime-${ymd}.png`;
writeFileSync(`out/${filename}`, png);
writeFileSync(`out/caption-${ymd}.txt`, caption);
console.log(`Guardado en out/${filename}`);

const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
  await sendToTelegram({
    token: TELEGRAM_BOT_TOKEN, chatId: TELEGRAM_CHAT_ID, png, filename,
    caption: `Story de hoy lista ✨ (${items.length} episodios)`,
    text: caption,
  });
  console.log('Enviado por Telegram');
} else {
  console.log('Sin TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID: no se envía, solo se guarda.');
}
}

main().catch(err => { console.error(err); process.exit(1); });
