// Convierte la lista de episodios en una story de Instagram (PNG 1080×1920) con la estética de @caba.kami.
// Usa satori (diseño → SVG) y resvg (SVG → PNG): sin navegador, funciona en cualquier sitio.

import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
// Se carga en formato CommonJS: la versión ESM de satori falla en Node 22.
const satoriLib = require('satori');
const satori = satoriLib.default ?? satoriLib.satori ?? satoriLib;

const font = (pkg, file) =>
  readFileSync(path.join(path.dirname(require.resolve(`${pkg}/package.json`)), 'files', file));
const poppins = w => [
  { name: 'Poppins', weight: w, style: 'normal', data: font('@fontsource/poppins', `poppins-latin-${w}-normal.woff`) },
  { name: 'Poppins', weight: w, style: 'normal', data: font('@fontsource/poppins', `poppins-latin-ext-${w}-normal.woff`) },
];

const FONTS = [
  ...poppins(400), ...poppins(500), ...poppins(600), ...poppins(700), ...poppins(900),
  { name: 'Fraunces', weight: 800, style: 'normal', data: font('@fontsource/fraunces', 'fraunces-latin-800-normal.woff') },
  { name: 'NotoJP', weight: 700, style: 'normal', data: font('@fontsource/noto-serif-jp', 'noto-serif-jp-japanese-700-normal.woff') },
];

// Ayudante para escribir el diseño sin JSX.
const h = (type, style = {}, ...children) => {
  const kids = children.flat().filter(c => c !== null && c !== false && c !== undefined);
  return { type, props: { style: { display: 'flex', ...style }, children: kids.length === 1 ? kids[0] : kids } };
};

// Las vocales con macrón (ō, ū…) se ven mal con estas fuentes: se escriben sin él, como es habitual en español.
const plain = t => t.normalize('NFD').replace(/̄/g, '').normalize('NFC');

export function formatDate(ymd) {
  const d = new Date(`${ymd}T12:00:00Z`);
  const f = opts => new Intl.DateTimeFormat('es-ES', { ...opts, timeZone: 'UTC' }).format(d);
  return { weekday: f({ weekday: 'long' }), day: f({ day: 'numeric' }), month: f({ month: 'long' }) };
}

export function formatTime(unix, tz) {
  return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: tz })
    .format(new Date(unix * 1000));
}

function sizesFor(n) {
  if (n <= 4) return { title: 50, english: 28, time: 38, meta: 22, pad: 30, clamp: 2 };
  if (n <= 5) return { title: 44, english: 26, time: 34, meta: 21, pad: 24, clamp: 2 };
  return { title: 38, english: 23, time: 31, meta: 19, pad: 15, clamp: 1 };
}

function row(item, c, s, tz) {
  return h('div', { flexDirection: 'row', alignItems: 'flex-start', padding: `${s.pad}px 0`, borderTop: `2px solid ${c.line}` },
    h('div', { width: 150, fontFamily: 'Poppins', fontWeight: 700, fontSize: s.time, color: c.accent, lineHeight: 1.2 },
      formatTime(item.airingAt, tz)),
    h('div', { flexDirection: 'column', flex: 1 },
      h('div', { fontFamily: 'Poppins', fontWeight: 700, fontSize: s.title, color: c.text, lineHeight: 1.12, display: 'block', overflow: 'hidden', lineClamp: s.clamp },
        plain(item.title)),
      item.titleEnglish && h('div', { fontFamily: 'Poppins', fontWeight: 400, fontSize: s.english, color: c.muted, marginTop: 4, display: 'block', overflow: 'hidden', lineClamp: 1 },
        plain(item.titleEnglish)),
      h('div', { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
        h('div', { fontFamily: 'Poppins', fontWeight: 600, fontSize: s.meta, color: c.muted, letterSpacing: 2.5 },
          `EP. ${item.episode}${item.totalEpisodes ? ` / ${item.totalEpisodes}` : ''}`),
        item.tag && h('div', {
          marginLeft: 16, padding: '3px 14px', borderRadius: 999, backgroundColor: c.accent,
          fontFamily: 'Poppins', fontWeight: 700, fontSize: s.meta - 2, color: c.background, letterSpacing: 2,
        }, item.tag),
      ),
    ),
  );
}

export async function renderStory(items, ymd, config) {
  const c = config.colors;
  const tz = config.timezone;
  const { weekday, day, month } = formatDate(ymd);
  const s = sizesFor(items.length);

  const list = items.length
    ? h('div', { flexDirection: 'column', borderBottom: `2px solid ${c.line}` }, items.map(i => row(i, c, s, tz)))
    : h('div', { fontFamily: 'Poppins', fontWeight: 600, fontSize: 52, color: c.muted, lineHeight: 1.2 },
        'Hoy no hay episodios destacados. Día de maratón.');

  const tree = h('div', {
    width: 1080, height: 1920, position: 'relative', flexDirection: 'column',
    backgroundColor: c.background,
    backgroundImage: `radial-gradient(circle at 90% 6%, ${c.glow} 0%, ${c.background} 58%)`,
    padding: '220px 90px 0 90px', color: c.text,
  },
    // 神 gigante de fondo, la marca de la cuenta
    h('div', { position: 'absolute', right: -60, top: 60, fontFamily: 'NotoJP', fontWeight: 700, fontSize: 620,
      color: c.accent, opacity: 0.07, lineHeight: 1 }, '神'),

    h('div', { fontFamily: 'Poppins', fontWeight: 700, fontSize: 30, color: c.text }, 'CabaKami News'),
    h('div', { fontFamily: 'Poppins', fontWeight: 900, fontSize: 106, lineHeight: 1, marginTop: 6, letterSpacing: -1 },
      'HOY SE EMITE'),
    h('div', { fontFamily: 'Poppins', fontWeight: 500, fontSize: 34, color: c.accent, marginTop: 14, marginBottom: 44 },
      `${weekday} ${day} de ${month}`),

    list,

    // Pie: logo + @ + aviso de hora. Queda por encima de la zona que tapa Instagram abajo.
    h('div', { position: 'absolute', left: 90, right: 90, top: 1530, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
      h('div', { flexDirection: 'row', alignItems: 'center' },
        h('div', { fontFamily: 'Fraunces', fontWeight: 800, fontSize: 54, color: c.text, letterSpacing: -1 }, config.brand ?? ''),
        h('div', { fontFamily: 'NotoJP', fontWeight: 700, fontSize: 46, color: c.text, marginLeft: 12, marginTop: 4 }, '神'),
      ),
      h('div', { flexDirection: 'column', alignItems: 'flex-end' },
        h('div', { fontFamily: 'Poppins', fontWeight: 600, fontSize: 28, color: c.text }, config.handle),
        h('div', { fontFamily: 'Poppins', fontWeight: 400, fontSize: 20, color: c.muted, marginTop: 2 },
          `Emisión en Japón · ${config.timezoneLabel ?? 'hora local'}`),
      ),
    ),
  );

  const svg = await satori(tree, { width: 1080, height: 1920, fonts: FONTS });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1080 } }).render().asPng();
}

// Texto para el caption y para el mensaje de Telegram.
export function buildCaption(items, ymd, config) {
  const { weekday, day, month } = formatDate(ymd);
  if (!items.length) return `📺 ${weekday} ${day} de ${month}: hoy no hay episodios destacados.`;
  const lines = items.map(i =>
    `${formatTime(i.airingAt, config.timezone)} · ${i.title}${i.titleEnglish ? ` (${i.titleEnglish})` : ''} — ep. ${i.episode}${i.tag ? ` · ${i.tag.toLowerCase()}` : ''}`);
  return [
    `📺 Hoy se emite · ${weekday} ${day} de ${month}`, '',
    ...lines, '',
    `Horas de emisión en Japón, en ${config.timezoneLabel ?? 'hora local'}.`,
    '¿Cuál vas a ver primero? 👇',
  ].join('\n');
}
