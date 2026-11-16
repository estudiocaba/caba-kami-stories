// Plantillas de carrusel de @caba.kami (1080×1350): «Entrega de anime» (6 diapositivas) y «Lista».
// Identidad v4 (noviembre 2026): negro, gris humo, vino y plata.
//   · IM Fell English: titulares.  · DotGothic16: rótulos y datos (pantalla de VHS).
//   · Zen Kaku Gothic New: texto corrido.  · Shippori Mincho: kanji del sello.
// Fondo: brocado de museo muy tenue + papel viejo (texturas/, ver LICENCIAS.md).
//
// Cuadrícula: márgenes de 72 px, 12 columnas de 56 px con calles de 24 px (ancho útil 936 px).
// Filas fijas en todas las diapositivas interiores: cabecera VHS a 72, rótulo a 150, título a 206,
// contenido desde 340, pie a 72 del borde inferior. Portada y cierre, simétricos sobre el eje central.
// Pocos elementos: puntilla arriba, un arco, un par de destellos en espejo y nada más.

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const fontCss = (pkg, file) =>
  pathToFileURL(path.join(path.dirname(require.resolve(`${pkg}/package.json`)), file)).href;
const TEXTURAS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../texturas');
const tex = nombre => pathToFileURL(path.join(TEXTURAS, nombre)).href;

const FONTS = [
  fontCss('@fontsource/im-fell-english', '400.css'),
  fontCss('@fontsource/im-fell-english', '400-italic.css'),
  fontCss('@fontsource/dotgothic16', '400.css'),
  fontCss('@fontsource/shippori-mincho', '700.css'),
  fontCss('@fontsource/zen-kaku-gothic-new', '400.css'),
  fontCss('@fontsource/zen-kaku-gothic-new', '700.css'),
];

// ── Cuadrícula ─────────────────────────────────────────────────────────────
const M = 72, COL = 56, CALLE = 24;
const cx = c => M + c * (COL + CALLE);          // x de la columna c (0–11)
const cw = n => n * COL + (n - 1) * CALLE;      // ancho de n columnas
const FILA = { cabecera: 72, rotulo: 150, titulo: 206, contenido: 340 };

const RUIDO = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const CSS = `
:root{--noche:#0e0d0f;--humo:#201e21;--humo-alto:#2e2b2f;--vino:#6b1528;--vino-vivo:#b8304d;--plata:#c9c7cb;--luna:#ecebee;--niebla:#8c8a90;--filete:#3d3a3f;
--display:"IM Fell English",Georgia,serif;--kanji:"Shippori Mincho","Noto Serif CJK JP",serif;--texto:"Zen Kaku Gothic New",sans-serif;--dato:"DotGothic16",monospace;}
body{margin:0;background:#000;}
.slide{width:1080px;height:1350px;position:relative;overflow:hidden;background:var(--noche);color:var(--luna);margin-bottom:20px;}
.grano{position:absolute;inset:0;pointer-events:none;z-index:9;background-image:url("${tex('papel.jpg')}");background-size:cover;mix-blend-mode:overlay;opacity:.22;}
.grano::after{content:"";position:absolute;inset:0;background-image:${RUIDO};opacity:.25;mix-blend-mode:screen;}
.brocado{position:absolute;inset:0;background:url("${tex('brocado.jpg')}") center/cover;mix-blend-mode:screen;opacity:.05;pointer-events:none;}
.vhs{position:absolute;left:${M}px;top:${FILA.cabecera}px;font-family:var(--dato);font-size:22px;letter-spacing:.08em;color:var(--niebla);display:flex;gap:16px;align-items:center;line-height:1;}
.rec{width:12px;height:12px;border-radius:50%;background:var(--vino-vivo);}
.der{position:absolute;right:${M}px;top:${FILA.cabecera}px;font-family:var(--dato);font-size:22px;letter-spacing:.08em;color:var(--niebla);line-height:1;}
.foto{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.luna-c{position:absolute;width:30px;height:30px;border-radius:50%;box-shadow:9px -2px 0 0 var(--plata);}
.banda{display:inline-block;background:var(--vino);color:var(--luna);font-family:var(--dato);font-size:22px;letter-spacing:.1em;padding:9px 16px 7px;line-height:1;}
.banda.plata{background:var(--plata);color:var(--noche);}
h1{margin:0;font-family:var(--display);font-weight:400;font-size:104px;line-height:.92;}
h2{margin:0;font-family:var(--display);font-weight:400;font-size:80px;line-height:.95;}
h1 em,h2 em{font-style:italic;color:var(--plata);}
.bajada{font-family:var(--display);font-style:italic;font-size:40px;line-height:1.15;color:var(--plata);}
.etq{font-family:var(--dato);font-size:22px;letter-spacing:.08em;color:var(--niebla);line-height:1.2;}
.cuerpo{font-family:var(--texto);font-size:34px;line-height:1.5;color:var(--luna);}
.cuerpo b{font-weight:700;}
.capitular::first-letter{float:left;font-family:var(--display);font-size:142px;line-height:.76;color:var(--vino-vivo);margin:10px 14px 0 0;}
.sello{position:absolute;right:${M}px;bottom:${M}px;width:96px;height:96px;background:var(--vino);border-radius:6px;display:grid;place-items:center;box-shadow:inset 0 0 0 4px var(--vino),inset 0 0 0 6px var(--plata);}
.sello span{font-family:var(--kanji);font-weight:700;font-size:60px;line-height:1;color:var(--luna);}
.pie{position:absolute;bottom:${M}px;font-family:var(--dato);font-size:19px;letter-spacing:.06em;color:var(--niebla);line-height:1;}
.fila{border-top:1px solid var(--filete);padding:18px 0 20px;}
.fila:last-child{border-bottom:1px solid var(--filete);}
.lab{font-family:var(--dato);font-size:19px;letter-spacing:.08em;color:var(--niebla);margin-bottom:8px;}
.val{font-family:var(--texto);font-weight:700;font-size:30px;line-height:1.25;color:var(--luna);}
.num{font-family:var(--display);line-height:.8;color:var(--vino-vivo);}
`;

// ── Ornamentos ────────────────────────────────────────────────────────────
// Arco ojival (en punta): dos arcos de radio 0,75 × ancho que se cruzan en el vértice.
function ojiva(w, h, closed = false) {
  const r = 0.75 * w;
  const rise = Math.sqrt(r * r - (r - w / 2) ** 2);
  const d = `M0,${h} L0,${rise.toFixed(1)} A${r},${r} 0 0 1 ${w / 2},0 A${r},${r} 0 0 1 ${w},${rise.toFixed(1)} L${w},${h}`;
  return closed ? d + ' Z' : d;
}

// Marco de arco con contenido recortado dentro (foto o HTML).
function arco(x, y, w, h, inner = '', inStyle = '') {
  const iw = w - 24, ih = h - 12;
  return `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px">
    <div style="position:absolute;left:12px;top:12px;width:${iw}px;height:${ih}px;clip-path:path('${ojiva(iw, ih, true)}');background:var(--humo-alto);overflow:hidden;${inStyle}">${inner}</div>
    <svg width="${w}" height="${h}" style="position:absolute;left:0;top:0;overflow:visible"><path d="${ojiva(w, h)}" style="fill:none;stroke:var(--plata);stroke-width:2"/></svg>
  </div>`;
}

// Destello de cuatro puntas, estilo shoujo de los 90.
const destello = (x, y, size, op = 0.9) =>
  `<svg width="${size}" height="${size}" viewBox="-1 -1 2 2" style="position:absolute;left:${x - size / 2}px;top:${y - size / 2}px;opacity:${op};z-index:5"><path d="M0,-1 C.08,-.08 .08,-.08 1,0 C.08,.08 .08,.08 0,1 C-.08,.08 -.08,.08 -1,0 C-.08,-.08 -.08,-.08 0,-1Z" style="fill:var(--plata)"/></svg>`;
const destellos = list => list.map(([x, y, s, o]) => destello(x, y, s, o)).join('');
// Par de destellos en espejo respecto del eje de un arco (centro).
const espejo = (centro, dx, y, s, o) => destellos([[centro - dx, y, s, o], [centro + dx, y, s, o]]);

// Puntilla fina en el borde superior: festones, ojales y una línea de puntos.
let encajeId = 0;
function puntilla(op = 0.32) {
  const id = `encaje${++encajeId}`;
  return `<svg width="1080" height="46" style="position:absolute;left:0;top:0;opacity:${op}">
    <defs><pattern id="${id}" width="48" height="46" patternUnits="userSpaceOnUse">
      <g style="fill:none;stroke:var(--plata);stroke-width:1.5">
        <line x1="0" y1="3" x2="48" y2="3"/><line x1="0" y1="14" x2="48" y2="14"/>
        <path d="M0,14 A24,24 0 0 0 48,14"/><path d="M9,14 A15,15 0 0 0 39,14"/>
        <circle cx="24" cy="23" r="4"/>
      </g>
      <g style="fill:var(--plata)"><circle cx="12" cy="8.5" r="1.6"/><circle cx="36" cy="8.5" r="1.6"/><circle cx="24" cy="41" r="1.8"/><circle cx="0" cy="17" r="1.4"/></g>
    </pattern></defs>
    <rect width="1080" height="46" fill="url(#${id})"/>
  </svg>`;
}

// Separador con rombo central.
const separador = w => `<svg width="${w}" height="16" style="display:block"><g style="stroke:var(--plata);stroke-width:1.5"><line x1="0" y1="8" x2="${w / 2 - 16}" y2="8"/><line x1="${w / 2 + 16}" y1="8" x2="${w}" y2="8"/></g><path d="M${w / 2},1 L${w / 2 + 7},8 L${w / 2},15 L${w / 2 - 7},8Z" style="fill:var(--plata)"/><circle cx="${w / 2 - 22}" cy="8" r="2" style="fill:var(--plata)"/><circle cx="${w / 2 + 22}" cy="8" r="2" style="fill:var(--plata)"/></svg>`;

const fondo = '<div class="brocado"></div>';
const grano = '<div class="grano"></div>';
const cabecera = (izq, der, colorDer) =>
  `${puntilla()}<div class="vhs"><span class="rec"></span>▶ PLAY&nbsp;&nbsp;${izq}</div><div class="der"${colorDer ? ` style="color:var(--${colorDer})"` : ''}>${der}</div>`;
const filas = rows => rows.map(([l, v, color]) =>
  `<div class="fila"><div class="lab">${l}</div><div class="val"${color ? ` style="color:var(--${color})"` : ''}>${v}</div></div>`).join('');
// Rótulo + título en las filas fijas, dentro de n columnas.
const encabezado = (rotulo, titulo, n = 12, size) => `
  <div style="position:absolute;left:${M}px;top:${FILA.rotulo}px;width:${cw(n)}px">${rotulo}</div>
  <h2 style="position:absolute;left:${M}px;top:${FILA.titulo}px;width:${cw(n)}px${size ? `;font-size:${size}px` : ''}">${titulo}</h2>`;

// Tratamiento de las fotos: cualquier imagen (también las de estética muy distinta) pasa por el mismo
// filtro para que parezca parte de la pieza y no pegada encima: menos saturación, velo vino,
// trama de puntos tipo manga, papel, sombra interior, viñeta y fundido a negro abajo.
const TRAMA = "radial-gradient(rgba(14,13,15,.55) 1px, transparent 1.6px)";
const arcoFoto = (img, fallback = '') => img
  ? `<img class="foto" src="${img}" style="object-position:center top;filter:saturate(.68) contrast(1.08) brightness(.88)">
     <div style="position:absolute;inset:0;background:var(--vino);mix-blend-mode:soft-light;opacity:.4"></div>
     <div style="position:absolute;inset:0;background-image:${TRAMA};background-size:5px 5px;mix-blend-mode:multiply;opacity:.35"></div>
     <div style="position:absolute;inset:0;background:url('${tex('papel.jpg')}') center/cover;mix-blend-mode:overlay;opacity:.3"></div>
     <div style="position:absolute;inset:0;background:radial-gradient(ellipse 75% 70% at 50% 38%, rgba(14,13,15,0) 50%, rgba(14,13,15,.65) 100%)"></div>
     <div style="position:absolute;left:0;right:0;bottom:0;height:28%;background:linear-gradient(to bottom, rgba(14,13,15,0), rgba(14,13,15,.75))"></div>
     <div style="position:absolute;inset:0;box-shadow:inset 0 0 40px rgba(14,13,15,.75)"></div>`
  : fallback;

// Títulos: «*palabra*» en la ficha se compone en cursiva plata.
const enfasis = t => String(t ?? '').replace(/\*(.+?)\*/g, '<em>$1</em>');
const tamTitulo = (texto, base, largo = 12) => (String(texto ?? '').replace(/\*/g, '').length > largo ? Math.round(base * .72) : base);

// ── Portada (común a Entrega y Lista): todo sobre el eje central ──────────
// Arco de 8 columnas centrado; rótulo, título y bajada centrados debajo; pie simétrico.
function portadaComun({ etiquetaVhs, banda, bandaPlata, sobre, titulo, bajada, img, fallback }) {
  const ax = cx(2), aw = cw(8), ay = 150, ah = 580;
  return `
<div class="slide">
  ${fondo}
  ${cabecera(etiquetaVhs, '@CABA.KAMI', 'plata')}
  <div class="luna-c" style="left:${540 - 19}px;top:104px"></div>
  ${arco(ax, ay, aw, ah, arcoFoto(img, fallback))}
  ${espejo(540, aw / 2 + 44, 380, 26)}${espejo(540, aw / 2 + 30, 600, 12, .7)}
  <div style="position:absolute;left:${M}px;right:${M}px;top:${ay + ah + 44}px;text-align:center">
    <div class="banda${bandaPlata ? ' plata' : ''}">${banda}</div>
    ${sobre ? `<div class="etq" style="margin:20px 0 0">${sobre}</div>` : ''}
    <h1 style="margin-top:22px">${titulo.map(enfasis).join('<br>')}</h1>
    <div class="bajada" style="margin:20px auto 0;max-width:${cw(9)}px">${bajada}</div>
  </div>
  <div class="pie" style="left:${M}px;bottom:${M + 38}px">DESLIZA ▸▸</div>
  <div class="sello"><span>神</span></div>
  ${grano}
</div>`;
}

function portada(s, img, media) {
  const p = s.portada;
  const fallback = `<div style="position:absolute;left:0;right:0;top:140px;text-align:center;font-family:var(--kanji);font-weight:700;font-size:260px;line-height:1;color:var(--plata)">${p.kanji ?? '夜'}</div>`;
  return portadaComun({
    etiquetaVhs: `ENTREGA Nº ${s.numero}`, banda: p.banda ?? 'ENTREGA DE ANIME', sobre: p.romaji,
    titulo: p.titulo, bajada: p.bajada, img, fallback,
  });
}

// ── Interiores de la Entrega ──────────────────────────────────────────────
function ficha(s, total) {
  const f = s.ficha;
  const y = FILA.contenido, ah = 520;
  return `
<div class="slide" style="background:var(--humo)">
  ${fondo}
  ${cabecera('00:02', `2 / ${total}`)}
  ${encabezado(`<div class="etq">${f.rotulo ?? 'DATOS VERIFICADOS'}</div>`, 'La ficha <em>técnica</em>')}
  ${arco(cx(0), y, cw(5), ah, `
      <div class="etq" style="font-size:19px;margin-top:110px">${f.cifraArriba}</div>
      <div style="font-family:var(--display);font-size:180px;line-height:.9;color:var(--vino-vivo);margin-top:12px">${f.cifra}</div>
      <div style="font-family:var(--dato);font-size:28px;letter-spacing:.14em;color:var(--luna)">${f.cifraUnidad}</div>
      <div class="etq" style="font-size:18px;line-height:1.55;margin-top:22px;color:var(--plata)">${f.cifraAbajo.join('<br>')}</div>`,
      'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 28px;box-sizing:border-box')}
  <div style="position:absolute;left:${cx(6)}px;width:${cw(6)}px;top:${y}px">${filas(f.filas)}</div>
  <div class="cuerpo" style="position:absolute;left:${M}px;width:${cw(12) - 80}px;top:${y + ah + 48}px;background:var(--noche);border:1px solid var(--filete);padding:34px 40px;font-size:31px">${f.frase}</div>
  <div class="pie" style="right:${M}px">${f.fuente}</div>
  ${grano}
</div>`;
}

function deQueVa(s, img, total) {
  const d = s.deQueVa;
  const ax = cx(7), aw = cw(5), ay = FILA.rotulo, ah = 640;
  return `
<div class="slide">
  ${fondo}
  ${cabecera('00:03', `3 / ${total}`)}
  ${encabezado('<div class="etq" style="color:var(--plata)">SIN SPOILERS</div>', 'De qué <em>va</em>', 7)}
  ${arco(ax, ay, aw, ah, arcoFoto(img))}
  <div class="etq" style="position:absolute;left:${ax}px;top:${ay + ah + 24}px;width:${aw}px;text-align:center;color:var(--plata)">${d.etiquetaProta}</div>
  <div class="cuerpo capitular" style="position:absolute;left:${M}px;width:${cw(7)}px;top:${FILA.contenido}px;font-size:33px">${d.parrafo}</div>
  <div style="position:absolute;left:${M}px;width:${cw(12)}px;top:${ay + ah + 96}px">
    <div style="display:flex;justify-content:center;margin-bottom:40px">${separador(240)}</div>
    <div class="cuerpo" style="font-size:34px;text-align:center;padding:0 ${COL + CALLE}px">${d.remate}</div>
  </div>
  ${grano}
</div>`;
}

function porQue(s, total) {
  const q = s.porQue;
  const items = q.items.map((t, i) => `
    <div style="display:flex;border-top:1px solid var(--filete);padding:40px 0${i === q.items.length - 1 ? ';border-bottom:1px solid var(--filete)' : ''}">
      <div class="num" style="font-size:96px;width:${cw(2) + CALLE}px;flex:none">${i + 1}</div>
      <div class="cuerpo" style="font-size:36px">${t}</div>
    </div>`).join('');
  return `
<div class="slide" style="background:var(--humo)">
  ${fondo}
  ${cabecera('00:04', `4 / ${total}`)}
  ${encabezado(`<div class="etq">${q.items.length} RAZONES</div>`, 'Por qué <em>engancha</em>')}
  <div style="position:absolute;left:${M}px;width:${cw(12)}px;top:${FILA.contenido}px">${items}</div>
  ${q.fuente ? `<div class="pie" style="left:${M}px">${q.fuente}</div>` : ''}
  ${grano}
</div>`;
}

function husbando(s, img, total) {
  const hb = s.husbando;
  const ax = cx(7), aw = cw(5), ay = FILA.rotulo, ah = 540;
  return `
<div class="slide">
  ${fondo}
  ${cabecera('00:05', `5 / ${total}`)}
  ${encabezado('<div class="banda plata">ALERTA HUSBANDO</div>', enfasis(hb.nombre), 7, tamTitulo(hb.nombre, 120, 9))}
  ${arco(ax, ay, aw, ah, arcoFoto(img))}
  ${espejo(ax + aw / 2, aw / 2 + 32, 260, 22)}
  <div class="bajada" style="position:absolute;left:${M}px;width:${cw(6)}px;top:${FILA.contenido + 30}px">${hb.bajada}</div>
  <div style="position:absolute;left:${M}px;width:${cw(12)}px;top:${ay + ah + 56}px">${filas(hb.filas)}</div>
  ${grano}
</div>`;
}

// ── Cierre: simétrico, sobre vino ─────────────────────────────────────────
function cierre(s) {
  const c = s.cierre;
  return `
<div class="slide" style="background:var(--vino)">
  ${fondo}
  ${puntilla(.4)}
  <div class="vhs" style="color:var(--plata)"><span style="width:12px;height:12px;background:var(--plata)"></span>■ STOP&nbsp;&nbsp;FIN DE LA ENTREGA</div>
  <svg width="${cw(12)}" height="800" style="position:absolute;left:${M}px;top:210px;overflow:visible"><path d="${ojiva(cw(12), 800)}" style="fill:none;stroke:var(--plata);stroke-width:2"/></svg>
  <div class="luna-c" style="left:${540 - 24}px;top:160px;width:40px;height:40px;box-shadow:12px -3px 0 0 var(--plata)"></div>
  ${espejo(540, 310, 560, 24)}${espejo(540, 290, 720, 11, .7)}
  <div style="position:absolute;left:${cx(1)}px;width:${cw(10)}px;top:470px;text-align:center">
    <h2 style="font-size:96px;line-height:.95">${c.pregunta.map(enfasis).join('<br>')}</h2>
    <div class="cuerpo" style="margin:40px auto 0;max-width:${cw(8)}px;font-size:31px">${c.texto}</div>
  </div>
  <div style="position:absolute;left:${M}px;right:${M}px;bottom:240px;display:flex;justify-content:center;gap:26px;font-family:var(--dato);font-size:24px;letter-spacing:.08em;color:var(--plata)"><span>GUARDAR</span><span>✦</span><span>COMPARTIR</span><span>✦</span><span>COMENTAR</span></div>
  <div style="position:absolute;left:${M}px;right:${M}px;bottom:${M}px;display:flex;justify-content:space-between;align-items:center">
    <div style="font-family:var(--display);font-style:italic;font-size:60px">caba<span style="color:var(--plata)">.</span>kami</div>
    <div style="width:96px;height:96px;background:var(--noche);border-radius:6px;display:grid;place-items:center;box-shadow:inset 0 0 0 4px var(--noche),inset 0 0 0 6px var(--plata)"><span style="font-family:var(--kanji);font-weight:700;font-size:60px;line-height:1">神</span></div>
  </div>
  ${grano}
</div>`;
}

const documento = slides => `<!doctype html><html lang="es"><head><meta charset="utf-8">
${FONTS.map(f => `<link rel="stylesheet" href="${f}">`).join('\n')}
<style>${CSS}</style></head><body>${slides.join('\n')}</body></html>`;

// Devuelve el HTML completo con una diapositiva por cada <div class="slide">.
export function buildEntrega(spec, imgs, media) {
  const total = 6;
  return documento([
    portada(spec, imgs.portada, media),
    ficha(spec, total),
    deQueVa(spec, imgs.prota, total),
    porQue(spec, total),
    husbando(spec, imgs.husbando, total),
    cierre(spec),
  ]);
}

// ── Plantilla «Lista»: portada + 1 a 8 elementos + cierre ─────────────────
// Sirve para rankings, tops de husbandos, novedades y estrenos.
// Todos los elementos usan la misma retícula: número, nombre y anime a la izquierda (7 columnas),
// arco a la derecha (5 columnas), datos y comentario a todo el ancho.
const KANJI = { husbandos: '恋', ranking: '血', estrenos: '新', actualidad: '新' };

function listaPortada(s, img) {
  const p = s.portada;
  const k = p.kanji ?? KANJI[s.pilar] ?? '夜';
  const fallback = `<div style="position:absolute;left:0;right:0;top:140px;text-align:center;font-family:var(--kanji);font-weight:700;font-size:260px;line-height:1;color:var(--plata)">${k}</div>`;
  return portadaComun({
    etiquetaVhs: p.etiqueta ?? '', banda: p.banda, bandaPlata: s.pilar === 'husbandos', sobre: p.sobretitulo,
    titulo: p.titulo, bajada: p.bajada, img, fallback,
  });
}

function listaItem(s, it, img, i, total) {
  const num = String(it.numero ?? i + 1).padStart(2, '0');
  const ax = cx(7), aw = cw(5), ay = FILA.rotulo, ah = 540;
  return `
<div class="slide"${i % 2 ? ' style="background:var(--humo)"' : ''}>
  ${fondo}
  ${cabecera(`00:${String(i + 2).padStart(2, '0')}`, `${i + 2} / ${total}`)}
  <div class="num" style="position:absolute;left:${M - 4}px;top:${FILA.rotulo}px;font-size:120px">${num}</div>
  <h2 style="position:absolute;left:${M}px;top:${FILA.contenido - 40}px;width:${cw(7)}px;font-size:${tamTitulo(it.nombre, 96, 14)}px;line-height:.95">${enfasis(it.nombre)}</h2>
  <div class="etq" style="position:absolute;left:${M}px;top:${FILA.contenido + 180}px;width:${cw(6)}px;color:var(--plata);line-height:1.5">${it.subtitulo ?? ''}</div>
  ${arco(ax, ay, aw, ah, arcoFoto(img))}
  ${espejo(ax + aw / 2, aw / 2 + 32, 260, 22)}
  <div style="position:absolute;left:${M}px;width:${cw(12)}px;top:${ay + ah + 56}px">
    ${filas(it.filas ?? [])}
    ${it.comentario ? `<div style="display:flex;justify-content:center;margin:48px 0 36px">${separador(240)}</div><div class="cuerpo" style="font-size:38px;line-height:1.45;text-align:center;padding:0 ${COL + CALLE}px">${it.comentario}</div>` : ''}
  </div>
  ${it.fuente ? `<div class="pie" style="left:${M}px">${it.fuente}</div>` : ''}
  ${grano}
</div>`;
}

export function buildLista(spec, portadaImg, itemImgs) {
  const total = spec.items.length + 2;
  return documento([
    listaPortada(spec, portadaImg),
    ...spec.items.map((it, i) => listaItem(spec, it, itemImgs[i], i, total)),
    cierre(spec),
  ]);
}

// Piezas compartidas con el generador de reels.
export { CSS, FONTS, puntilla, tex, destellos, arco, arcoFoto, separador, ojiva, enfasis };
