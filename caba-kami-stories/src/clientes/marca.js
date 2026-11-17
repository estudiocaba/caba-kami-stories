// Marca y reglas de cada cliente (clientes/<cuenta>/marca.json), compartidas por stories y carruseles.

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const dataUri = f => `data:image/${path.extname(f).slice(1).toLowerCase().replace('jpg', 'jpeg').replace('svg', 'svg+xml')};base64,${readFileSync(f).toString('base64')}`;

export function cargarMarca(cuenta) {
  const dir = path.join(RAIZ, 'clientes', cuenta);
  const marca = JSON.parse(readFileSync(path.join(dir, 'marca.json'), 'utf8'));
  if (marca.logo && !/^(https?:|data:)/.test(marca.logo)) marca.logo = dataUri(path.join(dir, marca.logo));
  return { marca, dir };
}

// Fotos: ruta dentro de la carpeta del cliente o URL. Las locales se incrustan.
export function fotoSrc(ref, dir) {
  if (!ref) return '';
  const local = path.resolve(dir, ref);
  return !/^https?:/.test(ref) && existsSync(local) ? dataUri(local) : ref;
}

// Todos los textos de una pieza (recorre el JSON), para revisarlos.
function textos(obj, fuera = new Set(['fecha', 'plantilla', 'tipo', 'foto', 'fotos', 'buscar', 'antes', 'despues', 'hasta', 'hex', 'tonos', 'fuentes', 'alt'])) {
  if (typeof obj === 'string') return [obj];
  if (Array.isArray(obj)) return obj.flatMap(o => textos(o, fuera));
  if (obj && typeof obj === 'object') return Object.entries(obj).filter(([k]) => !fuera.has(k)).flatMap(([, v]) => textos(v, fuera));
  return [];
}

// Revisa una pieza contra las reglas de la marca. Devuelve la lista de problemas (vacía si está bien).
//   "plantillas": [...]                plantillas de story permitidas
//   "evitar": {"pelo": "cabello"}      palabras prohibidas y su alternativa
//   "sinPrecios": true                 nada de importes (€, euros)
//   "sinHorarios": true                nada de horas (10:30, 17h…)
//   "peninsular": false                nada de vosotros, vuestro, os…
export function revisar(pieza, marca) {
  const r = marca.reglas ?? {};
  const fallos = [];
  if (marca.plantillas && pieza.plantilla && !marca.plantillas.includes(pieza.plantilla)) fallos.push(`la plantilla «${pieza.plantilla}» no se usa en esta cuenta`);
  const todo = textos(pieza).join('\n');
  for (const [mala, buena] of Object.entries(r.evitar ?? {})) {
    if (new RegExp(`(?<![\\wáéíóúñ])${mala}(?![\\wáéíóúñ])`, 'i').test(todo)) fallos.push(`dice «${mala}» (usar «${buena}»)`);
  }
  if (r.sinPrecios && /\d+([.,]\d+)?\s?(€|euros?\b)|€\s?\d/i.test(todo)) fallos.push('incluye un precio');
  if (r.sinHorarios && /\b([01]?\d|2[0-3])[:.][0-5]\d\b|\b([01]?\d|2[0-3])\s?h\b/i.test(todo)) fallos.push('incluye un horario');
  if (r.peninsular === false && /(?<![\wáéíóúñ])(vosotr[oa]s|vuestr[oa]s?|os\s+\w+|tío|tía|mola)(?![\wáéíóúñ])/i.test(todo)) fallos.push('usa vocabulario peninsular (vosotros, os, vuestro…)');
  if (pieza.precio && r.sinPrecios) fallos.push('tiene el campo «precio»');
  return fallos;
}
