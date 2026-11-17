// Fotos de internet para carruseles y stories de clientes (tendencias, cortes, peinados, colores).
// Solo de bancos cuya licencia permite el uso comercial:
//   · Pexels (licencia Pexels: uso comercial libre, sin atribución obligatoria). Necesita PEXELS_API_KEY.
//   · Openverse (fotos con licencia CC0, dominio público o CC BY/BY-SA). Sin clave. Si piden atribución,
//     el crédito se añade al copy.
// Nunca fotos de antes y después: esas tienen que ser trabajos reales del cliente.
//
// En una ficha, una foto puede ser:
//   "fotos/x.jpg" o "https://…"            archivo del cliente o URL directa
//   {"buscar": "copper hair woman"}         la primera foto buena que no se haya usado ya en la pieza
//   {"buscar": "...", "n": 5}               (en collages y tiras) varias fotos de la misma búsqueda
// Lo elegido se guarda en fotos.json junto a la salida, para repetir la generación sin volver a buscar.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const env = process.env;

async function buscarPexels(q, orientacion) {
  const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=${orientacion}&per_page=30`,
    { headers: { Authorization: env.PEXELS_API_KEY } });
  if (!r.ok) throw new Error(`Pexels ${r.status}`);
  const j = await r.json();
  return j.photos.map(p => ({ url: p.src.large2x || p.src.original, credito: `${p.photographer} (Pexels)`, atribucion: false, pagina: p.url }));
}

async function buscarOpenverse(q, orientacion) {
  const aspect = orientacion === 'portrait' ? '&aspect_ratio=tall' : '';
  const r = await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license_type=commercial&mature=false&size=large${aspect}&page_size=40`,
    { headers: { 'User-Agent': 'aquelarre-estudio-caba' } });
  if (!r.ok) throw new Error(`Openverse ${r.status}`);
  const j = await r.json();
  return j.results.filter(x => (x.width ?? 0) >= 900).map(x => ({
    url: x.url,
    credito: `${x.creator || 'autor desconocido'} (${String(x.license).toUpperCase() === 'CC0' || x.license === 'pdm' ? 'dominio público' : `CC ${String(x.license).toUpperCase()} ${x.license_version ?? ''}`.trim()}, ${x.source ?? 'Openverse'})`,
    atribucion: !['cc0', 'pdm'].includes(x.license), pagina: x.foreign_landing_url,
  }));
}

async function aDataUri(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'aquelarre-estudio-caba' } });
  if (!r.ok) throw new Error(`descarga ${r.status}`);
  const tipo = r.headers.get('content-type') || 'image/jpeg';
  if (!tipo.startsWith('image/')) throw new Error(`no es una imagen (${tipo})`);
  return `data:${tipo};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`;
}

// Recorre la pieza y sustituye cada {"buscar": …} por fotos reales (data URI). Devuelve los créditos.
export async function resolverFotos(pieza, salida, { orientacion = 'portrait' } = {}) {
  const guardado = existsSync(path.join(salida, 'fotos.json')) ? JSON.parse(readFileSync(path.join(salida, 'fotos.json'), 'utf8')) : {};
  const elegidas = {}, usadas = new Set(), creditos = [];
  const cache = {};
  const candidatas = async q => {
    if (cache[q]) return cache[q];
    let lista = [];
    try { if (env.PEXELS_API_KEY) lista = await buscarPexels(q, orientacion); } catch (e) { console.log(`  Pexels: ${e.message}`); }
    if (!lista.length) { try { lista = await buscarOpenverse(q, orientacion); } catch (e) { console.log(`  Openverse: ${e.message}`); } }
    return (cache[q] = lista);
  };
  const una = async (q, clave) => {
    const previa = guardado[clave];
    const prueba = previa ? [previa] : [];
    for (const c of [...prueba, ...(await candidatas(q))]) {
      if (usadas.has(c.url)) continue;
      try {
        const data = await aDataUri(c.url);
        usadas.add(c.url); elegidas[clave] = c; creditos.push(c);
        return data;
      } catch { /* siguiente */ }
    }
    console.log(`  ⚠ sin foto para «${q}»`);
    return null;
  };
  let k = 0;
  const visitar = async v => {
    if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) v[i] = await visitar(v[i]); return v; }
    if (v && typeof v === 'object') {
      if (typeof v.buscar === 'string') {
        if (v.n) { const out = []; for (let i = 0; i < v.n; i++) out.push(await una(v.buscar, `f${k++}`)); return out.filter(Boolean); }
        return await una(v.buscar, `f${k++}`);
      }
      for (const key of Object.keys(v)) v[key] = await visitar(v[key]);
    }
    return v;
  };
  await visitar(pieza);
  writeFileSync(path.join(salida, 'fotos.json'), JSON.stringify(elegidas, null, 2));
  const unicos = [...new Map(creditos.map(c => [c.credito, c])).values()];
  return { creditos: unicos, textoCreditos: unicos.length ? `Fotos: ${unicos.map(c => c.credito).join(' · ')}` : '' };
}
