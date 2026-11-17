// Carruseles de clientes (1080×1350) que se visten con la marca de cada uno (clientes/<cuenta>/marca.json).
//   node src/clientes/carrusel.js <cuenta> <ficha>      → clientes/<cuenta>/carruseles/<ficha>.json
//   --sin-telegram   no lo manda a revisar
//
// Ficha: {"fecha", "pieza", "diapositivas": [...], "copy", "hashtags", "fuentes", "alt"}
// Tipos de diapositiva:
//   portada  {etiqueta, titulo, bajada, foto?}
//   color    {numero, nombre, tonos: ["#hex", ...], texto}          muestra de color (tendencias de color)
//   punto    {numero, titulo, texto, foto?}                          un corte, un peinado, un tip
//   lista    {titulo, items: ["...", ...]}                           resumen o pasos
//   cierre   {titulo, texto}                                         con la llamada a la acción de la marca
// Antes de generar revisa las reglas del cliente (palabras prohibidas, precios, horarios, vocabulario).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { cargarMarca, fotoSrc, revisar, RAIZ } from './marca.js';
import { fuenteCss } from '../stories/plantillas.js';
import { cssEditorial, seccionEditorial } from './editorial.js';
import { resolverFotos } from './fotos.js';
import { sendDocumentGroup, sendText } from '../telegram.js';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const enf = s => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
const tam = (t = '', max, min) => { const n = String(t).length; return Math.round(n <= 24 ? max : n >= 90 ? min : max - (max - min) * (n - 24) / 66); };

function css(m) {
  const c = m.colores, r = m.esquinas ?? 0;
  return `*{box-sizing:border-box;margin:0;padding:0}
body{background:#000}
.dia{width:1080px;height:1350px;position:relative;overflow:hidden;background:${c.fondo};color:${c.texto};font-family:'${m.fuentes.texto}',sans-serif;}
.cab{position:absolute;left:88px;right:88px;top:72px;display:flex;justify-content:space-between;font-size:26px;letter-spacing:.12em;text-transform:uppercase;color:${c.suave};}
.cab b{color:${c.texto};font-weight:600;letter-spacing:.08em}
.pie{position:absolute;left:88px;right:88px;bottom:64px;display:flex;justify-content:space-between;align-items:center;font-size:24px;color:${c.suave};letter-spacing:.04em}
.pie img{height:56px}
.zona{position:absolute;left:88px;right:88px;top:170px;bottom:150px;display:flex;flex-direction:column;}
.etiqueta{align-self:flex-start;font-size:28px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:${c.fondo};background:${c.acento};padding:14px 24px 12px;border-radius:${Math.min(r, 40)}px}
.titulo{font-family:'${m.fuentes.titulo}',serif;font-weight:${m.pesoTitulo ?? 500};line-height:1.02;letter-spacing:-.015em}
.titulo em,.texto em{font-style:italic;color:${c.acento}}
.texto{font-size:40px;line-height:1.38}
.suave{color:${c.suave}}
.num{font-family:'${m.fuentes.titulo}',serif;font-size:120px;line-height:1;color:${c.acento}}
.linea{height:3px;background:${c.linea}}
.foto{background-size:cover;background-position:center;border-radius:${r}px;background-color:${c.linea}}
.desliza{font-size:26px;letter-spacing:.12em;text-transform:uppercase;color:${c.acento}}
`;
}

const DIAS = {
  portada: (d, m) => d.foto
    ? `<div class="foto" style="position:absolute;inset:0;border-radius:0" data-foto="${esc(d.foto)}"></div>
       <div style="position:absolute;inset:0;background:linear-gradient(to bottom, transparent 30%, ${m.colores.fondo} 82%)"></div>
       <div class="zona" style="justify-content:flex-end;gap:30px">${d.etiqueta ? `<span class="etiqueta">${esc(d.etiqueta)}</span>` : ''}
         <div class="titulo" style="font-size:${tam(d.titulo, 120, 80)}px">${enf(d.titulo)}</div>${d.bajada ? `<div class="texto suave">${enf(d.bajada)}</div>` : ''}</div>`
    : `<div class="zona" style="justify-content:center;gap:44px">${d.etiqueta ? `<span class="etiqueta">${esc(d.etiqueta)}</span>` : ''}
         <div class="titulo" style="font-size:${tam(d.titulo, 138, 92)}px">${enf(d.titulo)}</div>
         ${d.bajada ? `<div class="linea" style="width:140px"></div><div class="texto suave">${enf(d.bajada)}</div>` : ''}
         <div class="desliza">Desliza →</div></div>`,

  color: (d, m) => {
    const tonos = d.tonos ?? ['#000'];
    const fondo = tonos.length > 1 ? `linear-gradient(135deg, ${tonos.join(', ')})` : tonos[0];
    return `<div class="zona" style="gap:40px">
      <div style="display:flex;align-items:center;gap:40px"><span class="num">${esc(d.numero ?? '')}</span><div class="titulo" style="font-size:${tam(d.nombre, 92, 64)}px">${enf(d.nombre)}</div></div>
      <div style="flex:1;border-radius:${Math.max(m.esquinas ?? 0, 24)}px;background:${fondo};position:relative;overflow:hidden">
        <div style="position:absolute;inset:0;background:repeating-linear-gradient(100deg, rgba(255,255,255,.07) 0 18px, rgba(0,0,0,.06) 18px 40px)"></div>
        <div style="position:absolute;left:0;right:0;bottom:0;height:45%;background:linear-gradient(to bottom, transparent, rgba(255,255,255,.12))"></div>
      </div>
      <div class="texto">${enf(d.texto)}</div></div>`;
  },

  punto: (d, m) => `<div class="zona" style="gap:36px;${d.foto ? '' : 'justify-content:center'}">
      ${d.foto ? `<div class="foto" style="flex:1" data-foto="${esc(d.foto)}"></div>` : `<span class="num" style="font-size:260px;line-height:.8">${esc(d.numero ?? '')}</span><div class="linea" style="width:140px;background:${m.colores.acento}"></div>`}
      <div style="display:flex;gap:28px;align-items:baseline">${d.foto && d.numero ? `<span class="num" style="font-size:80px">${esc(d.numero)}</span>` : ''}
        <div class="titulo" style="font-size:${tam(d.titulo, 96, 66)}px">${enf(d.titulo)}</div></div>
      <div class="texto">${enf(d.texto)}</div></div>`,

  lista: (d, m) => `<div class="zona" style="justify-content:center;gap:40px">
      <div class="titulo" style="font-size:${tam(d.titulo, 92, 66)}px">${enf(d.titulo)}</div>
      <div>${(d.items ?? []).map((it, i) => `<div style="display:flex;gap:30px;padding:26px 0;border-top:3px solid ${m.colores.linea};align-items:baseline">
        <span class="titulo" style="font-size:52px;color:${m.colores.acento};min-width:64px">${i + 1}</span><span class="texto">${enf(it)}</span></div>`).join('')}</div></div>`,

  cierre: (d, m) => `<div class="zona" style="justify-content:center;gap:44px;text-align:center;align-items:center">
      <div class="titulo" style="font-size:${tam(d.titulo, 112, 80)}px">${enf(d.titulo)}</div>
      ${d.texto ? `<div class="texto suave" style="max-width:820px">${enf(d.texto)}</div>` : ''}
      <div class="texto" style="background:${m.colores.texto};color:${m.colores.fondo};padding:30px 48px;border-radius:${m.esquinas ?? 0}px;font-weight:600;font-size:36px">${enf(m.cta ?? 'Escríbenos')}</div>
      <div class="suave" style="font-size:30px;letter-spacing:.06em">${esc(m.handle)}</div></div>`,
};

export function htmlCarrusel(ficha, marca, dir) {
  const n = ficha.diapositivas.length;
  const fuentes = [...new Set([marca.fuentes.titulo, marca.fuentes.texto])].flatMap(f => fuenteCss(f, [300, 400, 500, 600, 700, 800, 900]));
  if (marca.estilo === 'editorial') {
    return `<!doctype html><html lang="es"><head><meta charset="utf-8">
${fuentes.map(u => `<link rel="stylesheet" href="${u}">`).join('\n')}
<style>${cssEditorial(marca, 1350)}</style></head><body>${ficha.diapositivas.map(d => `<section class="dia ed">${seccionEditorial(d, marca, 1350)}</section>`).join('\n')}</body></html>`
      .replace(/url\('(fotos\/[^']+)'\)/g, (_, ref) => `url('${fotoSrc(ref, dir)}')`);
  }
  const dias = ficha.diapositivas.map((d, i) => {
    const f = DIAS[d.tipo];
    if (!f) throw new Error(`Tipo de diapositiva desconocido: ${d.tipo}. Hay: ${Object.keys(DIAS).join(', ')}`);
    return `<section class="dia">
      <div class="cab"><b>${esc(marca.nombre)}</b><span>${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}</span></div>
      ${f(d, marca)}
      ${d.tipo === 'cierre' ? '' : `<div class="pie">${marca.logo ? `<img src="${marca.logo}">` : `<span>${esc(marca.handle)}</span>`}<span>${esc(d.fuente ? `Fuente: ${d.fuente}` : '')}</span></div>`}
    </section>`;
  }).join('\n');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
${fuentes.map(u => `<link rel="stylesheet" href="${u}">`).join('\n')}
<style>${css(marca)}</style></head><body>${dias}</body></html>`
    .replace(/data-foto="([^"]*)"/g, (_, ref) => (ref ? `style="background-image:url('${fotoSrc(ref, dir)}')"` : ''));
}

// ── Línea de comandos ──
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const [cuenta, nombre] = args.filter(a => !a.startsWith('--'));
  if (!cuenta || !nombre) { console.error('Uso: node src/clientes/carrusel.js <cuenta> <ficha>'); process.exit(1); }
  const { marca, dir } = cargarMarca(cuenta);
  const ficha = JSON.parse(readFileSync(path.join(dir, 'carruseles', `${nombre.replace(/\.json$/, '')}.json`), 'utf8'));
  const fallos = revisar({ ...ficha, fuentes: undefined }, marca);
  if (fallos.length) { console.error(`El carrusel ${nombre} no cumple las reglas de ${marca.nombre}:\n  ${fallos.join('\n  ')}`); process.exit(1); }

  const OUT = path.join(RAIZ, 'out', 'clientes', cuenta, 'carruseles', nombre.replace(/\.json$/, ''));
  mkdirSync(OUT, { recursive: true });
  const { textoCreditos } = await resolverFotos(ficha, OUT);
  if (textoCreditos) ficha.copy = `${ficha.copy ?? ''}\n\n📷 ${textoCreditos}`;
  const tmp = path.join(OUT, 'carrusel.html');
  writeFileSync(tmp, htmlCarrusel(ficha, marca, dir));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto('file://' + tmp, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const secciones = page.locator('section.dia');
  const archivos = [];
  for (let i = 0; i < await secciones.count(); i++) {
    const f = path.join(OUT, `${cuenta}-${path.basename(OUT)}-${i + 1}.jpg`);
    await secciones.nth(i).screenshot({ path: f, type: 'jpeg', quality: 92 });
    archivos.push(f);
  }
  await browser.close();
  writeFileSync(path.join(OUT, 'copy.txt'), `${ficha.copy ?? ''}\n\n${ficha.hashtags ?? ''}\n\nFuentes: ${ficha.fuentes ?? '—'}\nTexto alternativo: ${ficha.alt ?? '—'}\n`);
  console.log(`${archivos.length} diapositivas en ${OUT}`);

  const env = process.env;
  if (!args.includes('--sin-telegram') && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    await sendDocumentGroup({ token: env.TELEGRAM_BOT_TOKEN, chatId: env.TELEGRAM_CHAT_ID,
      files: archivos.map(f => ({ name: path.basename(f), data: readFileSync(f) })),
      caption: `${marca.nombre} · ${ficha.fecha} · ${ficha.pieza ?? nombre}` });
    await sendText({ token: env.TELEGRAM_BOT_TOKEN, chatId: env.TELEGRAM_CHAT_ID, text: `${ficha.copy ?? ''}\n\n${ficha.hashtags ?? ''}` });
    console.log('Enviado por Telegram');
  }
}
