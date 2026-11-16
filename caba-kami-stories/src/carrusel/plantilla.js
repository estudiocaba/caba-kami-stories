// Plantillas de carrusel de @caba.kami (1080×1350): «Entrega de anime» (6 diapositivas) y «Lista».
// Identidad v3 (noviembre 2026): negro, gris humo, vino y plata.
//   · IM Fell English: titulares con tipos de imprenta antigua, irregulares a propósito.
//   · DotGothic16: rótulos, datos y pantalla de VHS (letra de píxel japonesa de los 90).
//   · Zen Kaku Gothic New: texto corrido.  · Shippori Mincho: kanji y texto japonés vertical.
// Texturas reales de dominio público (ver LICENCIAS.md): encaje de bolillos, luna y rosa grabadas,
// papel viejo, brocado y humo. Nada de kanji fantasma gigante ni composiciones calcadas: cada
// diapositiva rompe la simetría por un lado distinto.

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

const RUIDO = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const CSS = `
:root{--noche:#0e0d0f;--humo:#201e21;--humo-alto:#2e2b2f;--vino:#6b1528;--vino-vivo:#b8304d;--plata:#c9c7cb;--luna:#ecebee;--niebla:#8c8a90;--filete:#3d3a3f;
--display:"IM Fell English",Georgia,serif;--kanji:"Shippori Mincho","Noto Serif CJK JP",serif;--texto:"Zen Kaku Gothic New",sans-serif;--dato:"DotGothic16",monospace;}
body{margin:0;background:#000;}
.slide{width:1080px;height:1350px;position:relative;overflow:hidden;background:var(--noche);color:var(--luna);margin-bottom:20px;}
/* Papel viejo real + grano fino: da la sensación de impreso, no de pantalla. */
.grano{position:absolute;inset:0;pointer-events:none;z-index:9;background-image:url("${tex('papel.jpg')}");background-size:cover;mix-blend-mode:overlay;opacity:.22;}
.grano::after{content:"";position:absolute;inset:0;background-image:${RUIDO};opacity:.25;mix-blend-mode:screen;}
.brocado{position:absolute;inset:0;background:url("${tex('brocado.jpg')}") center/cover;mix-blend-mode:screen;opacity:.05;pointer-events:none;}
.fantasma{display:none;}
.vhs{position:absolute;left:72px;top:68px;font-family:var(--dato);font-size:24px;letter-spacing:.08em;color:var(--niebla);display:flex;gap:16px;align-items:center;z-index:6;}
.rec{width:14px;height:14px;border-radius:50%;background:var(--vino-vivo);}
.der{position:absolute;right:72px;top:68px;font-family:var(--dato);font-size:24px;letter-spacing:.08em;color:var(--niebla);z-index:6;}
.foto{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.banda{display:inline-block;background:var(--vino);color:var(--luna);font-family:var(--dato);font-size:24px;letter-spacing:.1em;padding:9px 16px 7px;}
.banda.plata{background:var(--plata);color:var(--noche);}
h1{margin:0;font-family:var(--display);font-weight:400;font-size:116px;line-height:.9;letter-spacing:-.01em;}
h1 em,h2 em{font-style:italic;color:var(--plata);}
h2{margin:0;font-family:var(--display);font-weight:400;font-size:80px;line-height:.95;}
.bajada{font-family:var(--display);font-style:italic;font-size:42px;line-height:1.12;color:var(--plata);}
.etq{font-family:var(--dato);font-size:22px;letter-spacing:.08em;color:var(--niebla);}
.cuerpo{font-family:var(--texto);font-size:34px;line-height:1.5;color:var(--luna);}
.cuerpo b{font-weight:700;}
.capitular::first-letter{float:left;font-family:var(--display);font-size:150px;line-height:.74;color:var(--vino-vivo);margin:12px 16px 0 -4px;}
.sello{position:absolute;right:72px;bottom:72px;width:96px;height:96px;background:var(--vino);border-radius:6px;display:grid;place-items:center;box-shadow:inset 0 0 0 4px var(--vino),inset 0 0 0 6px var(--plata);transform:rotate(-5deg);z-index:6;}
.sello::after{content:"";position:absolute;inset:0;border-radius:6px;background-image:${RUIDO};mix-blend-mode:multiply;opacity:.5;}
.sello span{font-family:var(--kanji);font-weight:700;font-size:60px;line-height:1;color:var(--luna);}
.fuente{position:absolute;left:72px;bottom:72px;font-family:var(--dato);font-size:19px;letter-spacing:.06em;color:var(--niebla);z-index:6;}
.fila{border-top:1px solid var(--filete);padding:18px 0 20px;}
.fila:last-child{border-bottom:1px solid var(--filete);}
.lab{font-family:var(--dato);font-size:20px;letter-spacing:.08em;color:var(--niebla);margin-bottom:8px;}
.val{font-family:var(--texto);font-weight:700;font-size:32px;line-height:1.25;color:var(--luna);}
.tate{position:absolute;writing-mode:vertical-rl;font-family:var(--kanji);font-weight:700;letter-spacing:.24em;color:var(--plata);white-space:nowrap;z-index:6;}
.tate::before{content:"";position:absolute;right:-22px;top:0;bottom:0;border-right:1px solid var(--plata);opacity:.45;}
.num{font-family:var(--kanji);font-weight:700;line-height:1;color:var(--vino-vivo);}
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
  return `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:2">
    <div style="position:absolute;left:12px;top:12px;width:${iw}px;height:${ih}px;clip-path:path('${ojiva(iw, ih, true)}');background:var(--humo-alto);overflow:hidden;${inStyle}">${inner}</div>
    <svg width="${w}" height="${h}" style="position:absolute;left:0;top:0;overflow:visible"><path d="${ojiva(w, h)}" style="fill:none;stroke:var(--plata);stroke-width:2"/></svg>
  </div>`;
}

// Destello de cuatro puntas, estilo shoujo de los 90.
const destello = (x, y, size, op = 0.9) =>
  `<svg width="${size}" height="${size}" viewBox="-1 -1 2 2" style="position:absolute;left:${x - size / 2}px;top:${y - size / 2}px;opacity:${op};z-index:5"><path d="M0,-1 C.08,-.08 .08,-.08 1,0 C.08,.08 .08,.08 0,1 C-.08,.08 -.08,.08 -1,0 C-.08,-.08 -.08,-.08 0,-1Z" style="fill:var(--plata)"/></svg>`;
const destellos = list => list.map(([x, y, s, o]) => destello(x, y, s, o)).join('');

// Encaje de bolillos real (escaneo de museo, dominio público).
// lado: 'arriba' cuelga del borde superior; 'abajo' sube desde el inferior.
// desde/hasta: tramo visible en % del ancho; los extremos se deshacen con un fundido irregular.
function encaje({ lado = 'arriba', alto = 120, op = 0.5, desde = 0, hasta = 100, ancho = 1080 } = {}) {
  const fundido = `linear-gradient(to right, transparent ${Math.max(0, desde - 6)}%, #000 ${desde + 8}%, #000 ${hasta - 8}%, transparent ${Math.min(100, hasta + 6)}%)`;
  const mascara = desde <= 0 && hasta >= 100 ? '' : `-webkit-mask-image:${fundido};mask-image:${fundido};`;
  return `<div class="encaje" style="position:absolute;left:0;${lado === 'arriba' ? 'top' : 'bottom'}:0;width:${ancho}px;height:${alto}px;opacity:${op};z-index:1;
    background:url('${tex('encaje-banda.png')}') repeat-x 0 0/auto ${alto}px;${lado === 'abajo' ? 'transform:scaleY(-1);' : ''}${mascara}"></div>`;
}
// Compatibilidad: la «puntilla» de siempre ahora es el encaje real.
const puntilla = (op = 0.45) => encaje({ op, alto: 110 });

const luna = (x, y, size, op = 0.6, z = 1) =>
  `<img src="${tex('luna-grabado.png')}" style="position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;opacity:${op};z-index:${z}">`;
const rosa = (x, y, w, op = 0.85, giro = 0) =>
  `<img src="${tex('rosa-grabado.png')}" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;opacity:${op};z-index:4;transform:rotate(${giro}deg)">`;
const humo = (op = 0.3) =>
  `<div style="position:absolute;inset:0;background:url('${tex('humo.jpg')}') center/cover;mix-blend-mode:screen;opacity:${op};pointer-events:none"></div>`;
// Texto vertical corto: sin «temporada 3», sin subtítulos (se corta en el primer espacio).
const corto = t => t ? String(t).split(/[\s　：:]/)[0].slice(0, 9) : t;
const tate = (texto, estilo, size = 40) => texto ? `<div class="tate" style="font-size:${size}px;${estilo}">${texto}</div>` : '';

// Separador con rombo central.
const separador = w => `<svg width="${w}" height="16" style="display:block"><g style="stroke:var(--plata);stroke-width:1.5"><line x1="0" y1="8" x2="${w / 2 - 16}" y2="8"/><line x1="${w / 2 + 16}" y1="8" x2="${w}" y2="8"/></g><path d="M${w / 2},1 L${w / 2 + 7},8 L${w / 2},15 L${w / 2 - 7},8Z" style="fill:var(--plata)"/><circle cx="${w / 2 - 22}" cy="8" r="2" style="fill:var(--plata)"/><circle cx="${w / 2 + 22}" cy="8" r="2" style="fill:var(--plata)"/></svg>`;

const grano = '<div class="grano"></div>';
const vhs = t => `<div class="vhs"><span class="rec"></span>▶ PLAY&nbsp;&nbsp;${t}</div>`;
const filas = rows => rows.map(([l, v, color]) =>
  `<div class="fila"><div class="lab">${l}</div><div class="val"${color ? ` style="color:var(--${color})"` : ''}>${v}</div></div>`).join('');

// Tratamiento de las fotos: cualquier imagen (también las de estética muy distinta) pasa por el mismo
// filtro para que parezca parte de la pieza y no pegada encima: menos saturación, velo vino,
// trama de puntos tipo manga, papel, sombra interior, viñeta y fundido a negro abajo.
const TRAMA = "radial-gradient(rgba(14,13,15,.55) 1px, transparent 1.6px)";
const arcoFoto = (img, fallback = '') => img
  ? `<img class="foto" src="${img}" style="object-position:center top;filter:saturate(.68) contrast(1.08) brightness(.88)">
     <div style="position:absolute;inset:0;background:var(--vino);mix-blend-mode:soft-light;opacity:.4"></div>
     <div style="position:absolute;inset:0;background-image:${TRAMA};background-size:5px 5px;mix-blend-mode:multiply;opacity:.35"></div>
     <div style="position:absolute;inset:0;background:url('${tex('papel.jpg')}') center/cover;mix-blend-mode:overlay;opacity:.35"></div>
     <div style="position:absolute;inset:0;background:radial-gradient(ellipse 75% 70% at 50% 38%, rgba(14,13,15,0) 50%, rgba(14,13,15,.65) 100%)"></div>
     <div style="position:absolute;left:0;right:0;bottom:0;height:28%;background:linear-gradient(to bottom, rgba(14,13,15,0), rgba(14,13,15,.75))"></div>
     <div style="position:absolute;inset:0;box-shadow:inset 0 0 40px rgba(14,13,15,.75)"></div>`
  : fallback;

// Títulos: «*palabra*» en la ficha se compone en cursiva plata.
const enfasis = t => String(t ?? '').replace(/\*(.+?)\*/g, '<em>$1</em>');

// ── Entrega de anime ──────────────────────────────────────────────────────
function portadaComun({ etiquetaVhs, banda, bandaPlata, sobre, titulo, bajada, img, fallback, vertical }) {
  return `
<div class="slide">
  <div class="brocado"></div>
  ${luna(150, 118, 320, 0.5)}
  ${encaje({ lado: 'abajo', alto: 130, op: 0.42, desde: 30, hasta: 100 })}
  ${vhs(etiquetaVhs)}
  <div class="der" style="color:var(--plata)">@CABA.KAMI</div>
  ${arco(356, 128, 652, 800, arcoFoto(img, fallback))}
  ${tate(corto(vertical), 'left:84px;top:180px', 44)}
  ${destellos([[330, 420, 34], [1030, 610, 18, .75], [372, 880, 11, .6]])}
  <div style="position:absolute;left:72px;right:150px;bottom:178px;z-index:5">
    <div class="banda${bandaPlata ? ' plata' : ''}">${banda}</div>
    ${sobre ? `<div class="etq" style="margin:22px 0 10px;color:var(--plata)">${sobre}</div>` : '<div style="height:24px"></div>'}
    <h1>${titulo.map(enfasis).join('<br>')}</h1>
    <div class="bajada" style="margin-top:22px;max-width:760px">${bajada}</div>
  </div>
  <div class="etq" style="position:absolute;left:72px;bottom:72px;z-index:6">DESLIZA ▸▸</div>
  <div class="sello"><span>神</span></div>
  ${grano}
</div>`;
}

function portada(s, img, media) {
  const p = s.portada;
  const fallback = `<div style="position:absolute;left:0;right:0;top:160px;text-align:center;font-family:var(--kanji);font-weight:700;font-size:290px;line-height:1;color:var(--plata)">${p.kanji ?? '夜'}</div>`;
  return portadaComun({
    etiquetaVhs: `ENTREGA Nº ${s.numero}`, banda: p.banda ?? 'ENTREGA DE ANIME', sobre: p.romaji,
    titulo: p.titulo, bajada: p.bajada, img, fallback, vertical: p.tategaki ?? media?.title?.native,
  });
}

function ficha(s, total) {
  const f = s.ficha;
  return `
<div class="slide" style="background:var(--humo)">
  <div class="brocado" style="opacity:.06"></div>
  ${encaje({ alto: 120, op: 0.45, desde: 34, hasta: 80 })}
  ${vhs('00:02')}<div class="der">2 / ${total}</div>
  <h2 style="position:absolute;left:72px;top:150px;z-index:3">La ficha <em>técnica</em></h2>
  ${arco(72, 280, 400, 560, `
      <div class="etq" style="font-size:20px;margin-top:120px">${f.cifraArriba}</div>
      <div style="font-family:var(--display);font-size:190px;line-height:.9;color:var(--vino-vivo);margin:10px 0 0">${f.cifra}</div>
      <div style="font-family:var(--dato);font-size:30px;letter-spacing:.14em;color:var(--luna)">${f.cifraUnidad}</div>
      <div class="etq" style="font-size:19px;line-height:1.55;margin-top:24px;color:var(--plata)">${f.cifraAbajo.join('<br>')}</div>`,
      'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 30px;box-sizing:border-box')}
  ${destellos([[470, 310, 20], [92, 872, 12, .7]])}
  <div style="position:absolute;left:530px;right:72px;top:290px;z-index:3">${filas(f.filas)}</div>
  <div class="cuerpo" style="position:absolute;left:72px;right:210px;top:900px;background:var(--noche);border:1px solid var(--filete);padding:36px 40px;font-size:31px;z-index:3">${f.frase}</div>
  ${rosa(812, 836, 250, 0.85, -12)}
  <div class="fuente" style="left:auto;right:72px">${f.fuente}</div>
  ${grano}
</div>`;
}

function deQueVa(s, img, total) {
  const d = s.deQueVa;
  return `
<div class="slide">
  <div class="brocado"></div>
  ${encaje({ lado: 'abajo', alto: 120, op: 0.4, desde: 45, hasta: 100 })}
  ${vhs('00:03')}<div class="der">3 / ${total}</div>
  ${arco(624, 190, 384, 680, arcoFoto(img))}
  ${tate(d.tategaki ?? '主人公', 'right:30px;top:950px', 30)}
  ${destellos([[606, 300, 26], [1030, 540, 13, .8]])}
  <div class="etq" style="position:absolute;left:624px;top:895px;width:384px;text-align:center;color:var(--plata)">${d.etiquetaProta}</div>
  <div style="position:absolute;left:72px;width:510px;top:190px;z-index:3">
    <div class="etq" style="color:var(--plata)">SIN SPOILERS</div>
    <h2 style="margin:18px 0 64px">De qué <em>va</em></h2>
    <div class="cuerpo capitular" style="font-size:36px">${d.parrafo}</div>
    <div style="margin:44px 0 36px">${separador(240)}</div>
    <div class="cuerpo" style="font-size:36px">${d.remate}</div>
  </div>
  ${grano}
</div>`;
}

function porQue(s, total) {
  const q = s.porQue;
  const items = q.items.map((t, i) => `
    <div style="display:flex;gap:34px;align-items:flex-start;border-top:1px solid var(--filete);padding-top:40px${i === q.items.length - 1 ? ';border-bottom:1px solid var(--filete);padding-bottom:40px' : ''}">
      <div class="num" style="font-size:96px;width:110px;flex:none;margin-top:-4px">${DAIJI[i]}</div>
      <div class="cuerpo" style="font-size:36px">${t}</div>
    </div>`).join('');
  return `
<div class="slide" style="background:var(--humo)">
  <div class="brocado" style="opacity:.06"></div>
  ${luna(700, 960, 520, 0.32)}
  ${encaje({ alto: 110, op: 0.42, desde: 36, hasta: 82 })}
  ${vhs('00:04')}<div class="der">4 / ${total}</div>
  <h2 style="position:absolute;left:72px;top:160px;z-index:3">Por qué <em>engancha</em></h2>
  ${destellos([[930, 230, 24], [968, 278, 11, .7]])}
  <div style="position:absolute;left:72px;right:110px;top:340px;display:flex;flex-direction:column;gap:40px;z-index:3">${items}</div>
  ${q.fuente ? `<div class="fuente">${q.fuente}</div>` : ''}
  ${grano}
</div>`;
}

function husbando(s, img, total) {
  const hb = s.husbando;
  return `
<div class="slide">
  <div class="brocado"></div>
  ${encaje({ alto: 110, op: 0.45, desde: 32, hasta: 62 })}
  ${vhs('00:05')}<div class="der">5 / ${total}</div>
  <div style="position:absolute;left:72px;top:180px;z-index:3"><div class="banda plata">ALERTA HUSBANDO</div></div>
  ${arco(676, 150, 332, 450, arcoFoto(img))}
  ${rosa(560, 470, 330, 0.9, 8)}
  ${destellos([[664, 196, 32], [1030, 340, 16], [400, 300, 18, .8]])}
  <h2 style="position:absolute;left:72px;top:262px;width:600px;font-size:132px;line-height:.86;z-index:3">${enfasis(hb.nombre)}</h2>
  <div class="bajada" style="position:absolute;left:72px;top:${hb.nombre.length > 9 ? 520 : 420}px;width:520px;z-index:3">${hb.bajada}</div>
  <div style="position:absolute;left:72px;right:72px;top:680px;z-index:3">${filas(hb.filas)}</div>
  ${grano}
</div>`;
}

function cierre(s) {
  const c = s.cierre;
  return `
<div class="slide" style="background:var(--vino)">
  ${humo(0.32)}
  ${encaje({ alto: 130, op: 0.5 })}
  <div class="vhs" style="color:var(--plata);top:160px"><span style="width:14px;height:14px;background:var(--plata)"></span>■ STOP&nbsp;&nbsp;FIN DE LA ENTREGA</div>
  <svg width="936" height="790" style="position:absolute;left:72px;top:250px;overflow:visible;z-index:2"><path d="${ojiva(936, 790)}" style="fill:none;stroke:var(--plata);stroke-width:2"/></svg>
  ${luna(475, 300, 130, 0.9, 3)}
  ${destellos([[230, 560, 26], [862, 680, 17], [266, 724, 10, .7]])}
  <div style="position:absolute;left:150px;right:150px;top:500px;text-align:center;z-index:3">
    <h2 style="font-size:100px;line-height:.92">${c.pregunta.map(enfasis).join('<br>')}</h2>
    <div class="cuerpo" style="margin:40px auto 0;max-width:660px;font-size:31px">${c.texto}</div>
  </div>
  <div style="position:absolute;left:72px;right:72px;bottom:240px;display:flex;justify-content:center;gap:26px;font-family:var(--dato);font-size:26px;letter-spacing:.08em;color:var(--plata);z-index:3"><span>GUARDAR</span><span>✦</span><span>COMPARTIR</span><span>✦</span><span>COMENTAR</span></div>
  <div style="position:absolute;left:72px;right:72px;bottom:72px;display:flex;justify-content:space-between;align-items:center;z-index:3">
    <div style="font-family:var(--display);font-style:italic;font-size:64px">caba<span style="color:var(--plata)">.</span>kami</div>
    <div style="width:96px;height:96px;background:var(--noche);border-radius:6px;display:grid;place-items:center;box-shadow:inset 0 0 0 4px var(--noche),inset 0 0 0 6px var(--plata);transform:rotate(4deg)"><span style="font-family:var(--kanji);font-weight:700;font-size:60px;line-height:1">神</span></div>
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
// Numerales kanji formales (daiji): se leen como numeración de documento antiguo.
const DAIJI = ['壱', '弐', '参', '肆', '伍', '陸', '漆', '捌', '玖', '拾'];
const KANJI = { husbandos: '恋', ranking: '血', estrenos: '新', actualidad: '新' };
// Texto vertical por defecto según el pilar (si el elemento no trae el título japonés).
const VERTICAL = { husbandos: '二次元の恋人', ranking: '番付', estrenos: '新作情報', actualidad: '速報' };

function listaPortada(s, img) {
  const p = s.portada;
  const k = p.kanji ?? KANJI[s.pilar] ?? '夜';
  const fallback = `<div style="position:absolute;left:0;right:0;top:160px;text-align:center;font-family:var(--kanji);font-weight:700;font-size:290px;line-height:1;color:var(--plata)">${k}</div>`;
  return portadaComun({
    etiquetaVhs: p.etiqueta ?? '', banda: p.banda, bandaPlata: s.pilar === 'husbandos', sobre: p.sobretitulo,
    titulo: p.titulo, bajada: p.bajada, img, fallback, vertical: p.tategaki ?? VERTICAL[s.pilar],
  });
}

// Los elementos alternan lado (foto a la derecha / a la izquierda) y la posición del encaje,
// para que el carrusel no sea la misma diapositiva repetida.
function listaItem(s, it, img, i, total) {
  const num = it.numero ?? i + 1;
  const der = i % 2 === 0;
  const largo = (it.nombre?.length ?? 0) > 14;
  const fotoX = der ? 656 : 72, textoX = der ? 72 : 470;
  const vertical = it.tategaki ?? it.nativo ?? VERTICAL[s.pilar];
  return `
<div class="slide"${i % 2 ? ' style="background:var(--humo)"' : ''}>
  <div class="brocado"${i % 2 ? ' style="opacity:.06"' : ''}></div>
  ${der ? encaje({ alto: 110, op: 0.45, desde: 34, hasta: 80 }) : encaje({ lado: 'abajo', alto: 110, op: 0.4, desde: 40, hasta: 100 })}
  ${vhs(`00:${String(i + 2).padStart(2, '0')}`)}<div class="der">${i + 2} / ${total}</div>
  ${arco(fotoX, 150, 352, 500, arcoFoto(img))}
  ${tate(corto(vertical), der ? 'right:22px;top:700px' : 'left:30px;top:700px', 28)}
  ${s.pilar === 'husbandos' && i % 3 === 1 ? rosa(der ? 540 : 320, 520, 300, 0.85, der ? 8 : -8) : ''}
  ${destellos(der ? [[664, 196, 28], [1030, 330, 15]] : [[418, 196, 28], [52, 330, 15]])}
  <div style="position:absolute;left:${textoX}px;top:150px;width:${der ? 580 : 540}px;z-index:3">
    <div style="display:flex;align-items:flex-end;gap:16px"><span class="num" style="font-size:128px">${DAIJI[num - 1] ?? num}</span><span class="etq" style="padding-bottom:18px">Nº ${String(num).padStart(2, '0')}</span></div>
    <h2 style="margin-top:24px;font-size:${largo ? 70 : 96}px;line-height:.92">${enfasis(it.nombre)}</h2>
    <div class="etq" style="margin-top:20px;color:var(--plata);line-height:1.5">${it.subtitulo ?? ''}</div>
  </div>
  <div style="position:absolute;left:${der ? 72 : 120}px;right:${der ? 120 : 72}px;top:700px;z-index:3">
    ${filas(it.filas ?? [])}
    ${it.comentario ? `<div style="margin:50px 0 0">${separador(240)}</div><div class="cuerpo" style="margin-top:36px;font-size:42px;line-height:1.42">${it.comentario}</div>` : ''}
  </div>
  ${it.fuente ? `<div class="fuente"${der ? '' : ' style="left:auto;right:72px"'}>${it.fuente}</div>` : ''}
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
export { CSS, FONTS, puntilla, encaje, luna, rosa, humo, tex, destellos, arco, arcoFoto, separador, ojiva, enfasis };
