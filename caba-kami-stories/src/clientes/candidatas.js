// Busca fotos candidatas para las piezas de un cliente y arma hojas de contacto numeradas para elegir.
// Solo fotos gratuitas de Unsplash (licencia Unsplash: uso comercial libre; se descartan las de Unsplash+).
//
//   node src/clientes/candidatas.js <cuenta> [prefijo]
//
// Salida: out/candidatas/<cuenta>/<pieza>__<hueco>.jpg (hoja) y candidatas.json (todas las opciones).
// Con lo elegido se escribe clientes/<cuenta>/fotos/elegidas.json, que fotos.js usa al generar.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const [cuenta, prefijo = ''] = process.argv.slice(2);
if (!cuenta) { console.log('Uso: node src/clientes/candidatas.js <cuenta> [prefijo]'); process.exit(1); }
const dir = path.join('clientes', cuenta);
const OUT = path.join('out', 'candidatas', cuenta);
mkdirSync(OUT, { recursive: true });

// Huecos de foto, en el mismo orden en que fotos.js los recorre.
function huecos(pieza) {
  const lista = [];
  const visitar = v => {
    if (Array.isArray(v)) return v.forEach(visitar);
    if (v && typeof v === 'object') {
      if (typeof v.buscar === 'string') { lista.push({ q: v.buscar, n: v.n || 1 }); return; }
      Object.values(v).forEach(visitar);
    }
  };
  visitar(pieza);
  return lista;
}

const pedidos = [];
for (const f of readdirSync(path.join(dir, 'carruseles')).sort()) {
  if (!f.endsWith('.json') || !f.startsWith(prefijo)) continue;
  const pieza = f.replace(/\.json$/, '');
  huecos(JSON.parse(readFileSync(path.join(dir, 'carruseles', f), 'utf8'))).forEach((h, i) => pedidos.push({ pieza, hueco: i + 1, ...h }));
}
const dirStories = path.join(dir, 'stories');
if (existsSync(dirStories)) for (const f of readdirSync(dirStories).sort()) {
  if (!f.endsWith('.json')) continue;
  const d = JSON.parse(readFileSync(path.join(dirStories, f), 'utf8'));
  for (const s of (Array.isArray(d) ? d : d.stories ?? [])) {
    if (!s.fecha?.startsWith(prefijo)) continue;
    huecos(s).slice(0, 1).forEach(h => pedidos.push({ pieza: 'stories', hueco: Number(s.fecha.slice(8, 10)), ...h }));
  }
}

const cache = {};
async function unsplash(q, cuantas) {
  if (cache[q]) return cache[q];
  const fotos = [];
  for (let page = 1; page <= 3 && fotos.length < cuantas; page++) {
    const r = await fetch(`https://unsplash.com/napi/search/photos?query=${encodeURIComponent(q)}&per_page=30&page=${page}&orientation=portrait`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (aquelarre-estudio-caba)', Accept: 'application/json' } });
    if (!r.ok) { console.log(`  Unsplash ${r.status} para «${q}»`); break; }
    const j = await r.json();
    for (const p of j.results ?? []) {
      if (p.premium || p.plus || p.sponsorship) continue;
      if (fotos.length < cuantas) fotos.push({
        id: p.id,
        url: `${p.urls.raw}&w=1600&q=85&fm=jpg&fit=max`,
        mini: p.urls.small,
        credito: `${p.user?.name ?? 'Unsplash'} (Unsplash)`,
        pagina: p.links?.html,
        alt: p.alt_description ?? p.description ?? '',
      });
    }
  }
  return (cache[q] = fotos);
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' });
const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
const todas = {};
for (const p of pedidos) {
  const cuantas = p.n > 1 ? Math.max(14, p.n * 2 + 2) : 10;
  const fotos = await unsplash(p.q, cuantas);
  const clave = `${p.pieza}__${String(p.hueco).padStart(2, '0')}`;
  todas[clave] = { q: p.q, n: p.n, fotos };
  if (!fotos.length) continue;
  const cols = 5, ancho = 190, alto = 260;
  const html = `<body style="margin:0;background:#111;font:bold 22px sans-serif;color:#fff">
    <div style="padding:6px 10px;font-size:16px">${clave} · «${p.q}» · hacen falta ${p.n}</div>
    <div style="display:grid;grid-template-columns:repeat(${cols},${ancho}px);gap:6px;padding:0 6px 6px">
    ${fotos.map((f, i) => `<div style="position:relative;width:${ancho}px;height:${alto}px;background:url('${f.mini}') center/cover">
      <span style="position:absolute;left:4px;top:4px;background:#e33;padding:1px 7px;border-radius:4px">${i + 1}</span></div>`).join('')}
    </div></body>`;
  await page.setContent(html, { waitUntil: 'networkidle' });
  const h = 36 + Math.ceil(fotos.length / cols) * (alto + 6);
  await page.setViewportSize({ width: cols * (ancho + 6) + 6, height: h });
  await page.screenshot({ path: path.join(OUT, `${clave}.jpg`), type: 'jpeg', quality: 70 });
  console.log(`✓ ${clave} (${fotos.length})`);
}
await browser.close();
writeFileSync(path.join(OUT, 'candidatas.json'), JSON.stringify(todas, null, 1));
console.log(`${Object.keys(todas).length} huecos → ${OUT}`);
