// Busca recursos libres (CC0 / dominio público) para la marca y los descarga con su licencia anotada.
//   node src/recursos/buscar.js            → recursos/ (sonidos, texturas y catalogo.json)
//
// Fuentes:
//  · Openverse (api.openverse.org): sonidos de Freesound y otras colecciones, solo licencia CC0.
//  · The Met Collection API: piezas de dominio público (CC0), por ejemplo encajes antiguos.
//  · Openverse imágenes: texturas CC0 / dominio público.

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('recursos');
const catalogo = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = { 'User-Agent': 'caba-kami-recursos/1.0 (github.com/estudiocaba/caba-kami-stories)' };

async function json(url) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, { headers: UA }).catch(() => null);
    if (r?.ok) return r.json();
    await sleep(1500);
  }
  console.warn('  ⚠ sin respuesta:', url);
  return null;
}

async function bajar(url, destino) {
  const r = await fetch(url, { headers: UA }).catch(() => null);
  if (!r?.ok) { console.warn('  ⚠ no se pudo bajar', url); return false; }
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > 15e6) { console.warn('  ⚠ demasiado grande', url); return false; }
  writeFileSync(destino, buf);
  return true;
}

const slug = s => s.toLowerCase().normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

// ── Sonidos ────────────────────────────────────────────────────────────────
const SONIDOS = {
  'vhs-insertar': 'vhs insert tape',
  'vhs-expulsar': 'vcr eject',
  'vhs-rebobinar': 'tape rewind',
  'vhs-ruido': 'vhs static noise',
  'cinta-stop': 'tape stop',
  'maquina-escribir': 'typewriter key',
  'pagina': 'page turn book',
  'caja-musica': 'music box',
  'campana': 'small bell chime',
  'sello': 'rubber stamp',
  'cerilla': 'match strike',
  'vela': 'candle flame',
  'viento': 'wind howl night',
  'cuervo': 'crow',
};

async function sonidos() {
  const dir = path.join(OUT, 'sonidos');
  mkdirSync(dir, { recursive: true });
  for (const [clave, q] of Object.entries(SONIDOS)) {
    const d = await json(`https://api.openverse.org/v1/audio/?q=${encodeURIComponent(q)}&license=cc0&page_size=12`);
    const res = (d?.results ?? []).filter(x => x.url && (!x.duration || x.duration < 20000)).slice(0, 4);
    console.log(`${clave}: ${res.length}`);
    let k = 0;
    for (const x of res) {
      const ext = (x.filetype || path.extname(new URL(x.url).pathname).slice(1) || 'mp3').replace('mpeg', 'mp3');
      const nombre = `${clave}-${++k}.${ext}`;
      if (await bajar(x.url, path.join(dir, nombre))) {
        catalogo.push({ tipo: 'sonido', archivo: `sonidos/${nombre}`, titulo: x.title, autor: x.creator, licencia: x.license_url || 'CC0', fuente: x.foreign_landing_url, duracion_ms: x.duration, origen: x.source });
      }
      await sleep(300);
    }
  }
}

// ── Texturas de museo (The Met, dominio público) ───────────────────────────
const MET = { encaje: 'lace', bordado: 'embroidery silk', terciopelo: 'velvet', 'manuscrito': 'illuminated manuscript', 'rosa': 'rose botanical' };

async function met() {
  const dir = path.join(OUT, 'texturas');
  mkdirSync(dir, { recursive: true });
  for (const [clave, q] of Object.entries(MET)) {
    const d = await json(`https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=${encodeURIComponent(q)}`);
    const ids = (d?.objectIDs ?? []).slice(0, 40);
    let k = 0;
    for (const id of ids) {
      if (k >= 5) break;
      const o = await json(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
      await sleep(150);
      if (!o?.isPublicDomain || !o.primaryImage) continue;
      const nombre = `met-${clave}-${++k}-${slug(o.title)}.jpg`;
      if (await bajar(o.primaryImage, path.join(dir, nombre))) {
        catalogo.push({ tipo: 'textura', archivo: `texturas/${nombre}`, titulo: o.title, fecha: o.objectDate, autor: o.artistDisplayName || o.culture || 'The Met', licencia: 'CC0 (The Met Open Access)', fuente: o.objectURL });
      }
    }
    console.log(`met ${clave}: ${k}`);
  }
}

// ── Texturas de Openverse (CC0 / dominio público) ─────────────────────────
const TEXTURAS = { 'papel-viejo': 'old paper texture', 'pelicula': 'film grain dust scratches', 'terciopelo-negro': 'black velvet texture', 'cera': 'candle wax', 'humo': 'smoke black background' };

async function texturas() {
  const dir = path.join(OUT, 'texturas');
  mkdirSync(dir, { recursive: true });
  for (const [clave, q] of Object.entries(TEXTURAS)) {
    const d = await json(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license=cc0,pdm&page_size=12`);
    const res = (d?.results ?? []).filter(x => (x.width ?? 0) >= 1000).slice(0, 4);
    let k = 0;
    for (const x of res) {
      const nombre = `${clave}-${++k}.jpg`;
      if (await bajar(x.url, path.join(dir, nombre))) {
        catalogo.push({ tipo: 'textura', archivo: `texturas/${nombre}`, titulo: x.title, autor: x.creator, licencia: x.license_url || x.license, fuente: x.foreign_landing_url, origen: x.source });
      }
      await sleep(300);
    }
    console.log(`${clave}: ${k}`);
  }
}

await sonidos();
await met();
await texturas();
writeFileSync(path.join(OUT, 'catalogo.json'), JSON.stringify(catalogo, null, 2));
console.log(`${catalogo.length} recursos en ${OUT}`);
