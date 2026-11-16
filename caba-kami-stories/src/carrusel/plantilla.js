// Plantilla «Entrega de anime» de @caba.kami: 6 diapositivas de 1080×1350.
// Identidad: negro, gris humo, vino y plata; Cormorant Garamond, Zen Kaku Gothic New, IBM Plex Mono y Shippori Mincho.

import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const fontCss = (pkg, file) =>
  pathToFileURL(path.join(path.dirname(require.resolve(`${pkg}/package.json`)), file)).href;

const FONTS = [
  fontCss('@fontsource/cormorant-garamond', '500-italic.css'),
  fontCss('@fontsource/cormorant-garamond', '600-italic.css'),
  fontCss('@fontsource/shippori-mincho', '700.css'),
  fontCss('@fontsource/zen-kaku-gothic-new', '400.css'),
  fontCss('@fontsource/zen-kaku-gothic-new', '700.css'),
  fontCss('@fontsource/ibm-plex-mono', '400.css'),
  fontCss('@fontsource/ibm-plex-mono', '500.css'),
];

const CSS = `
:root{--noche:#0e0d0f;--humo:#201e21;--humo-alto:#2e2b2f;--vino:#6b1528;--vino-vivo:#b8304d;--plata:#c9c7cb;--luna:#ecebee;--niebla:#8c8a90;--filete:#3d3a3f;
--display:"Cormorant Garamond",Georgia,serif;--kanji:"Shippori Mincho","Noto Serif CJK JP",serif;--texto:"Zen Kaku Gothic New",sans-serif;--dato:"IBM Plex Mono",monospace;}
body{margin:0;background:#000;}
.slide{width:1080px;height:1350px;position:relative;overflow:hidden;background:var(--noche);color:var(--luna);margin-bottom:20px;}
.grano{position:absolute;inset:0;opacity:.07;pointer-events:none;z-index:9;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");}
.fantasma{position:absolute;font-family:var(--kanji);font-weight:700;line-height:1;color:var(--plata);opacity:.07;}
.vhs{position:absolute;left:72px;top:72px;font-family:var(--dato);font-size:20px;letter-spacing:.14em;color:var(--niebla);display:flex;gap:18px;align-items:center;}
.rec{width:14px;height:14px;border-radius:50%;background:var(--vino-vivo);}
.der{position:absolute;right:72px;top:72px;font-family:var(--dato);font-size:20px;letter-spacing:.14em;color:var(--niebla);}
.arco{position:absolute;border:2px solid var(--plata);border-bottom:0;border-radius:999px 999px 0 0;padding:12px 12px 0;box-sizing:border-box;}
.arco .in{width:100%;height:100%;border:1px solid var(--filete);border-bottom:0;border-radius:999px 999px 0 0;background:var(--humo-alto);position:relative;overflow:hidden;}
.foto{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.luna-c{position:absolute;width:30px;height:30px;border-radius:50%;box-shadow:9px -2px 0 0 var(--plata);}
.banda{display:inline-block;background:var(--vino);color:var(--luna);font-family:var(--dato);font-size:20px;letter-spacing:.16em;padding:10px 18px;}
.banda.plata{background:var(--plata);color:var(--noche);}
h1{margin:0;font-family:var(--display);font-style:italic;font-weight:600;font-size:104px;line-height:.95;}
h2{margin:0;font-family:var(--display);font-style:italic;font-weight:600;font-size:72px;line-height:1;}
.bajada{font-family:var(--display);font-style:italic;font-weight:500;font-size:40px;line-height:1.15;color:var(--plata);}
.etq{font-family:var(--dato);font-size:20px;letter-spacing:.14em;color:var(--niebla);}
.cuerpo{font-family:var(--texto);font-size:34px;line-height:1.5;color:var(--luna);}
.cuerpo b{font-weight:700;}
.capitular::first-letter{float:left;font-family:var(--display);font-style:italic;font-weight:600;font-size:132px;line-height:.78;color:var(--vino-vivo);margin:10px 14px 0 0;}
.sello{position:absolute;right:72px;bottom:72px;width:96px;height:96px;background:var(--vino);border-radius:6px;display:grid;place-items:center;box-shadow:inset 0 0 0 4px var(--vino),inset 0 0 0 6px var(--plata);}
.sello span{font-family:var(--kanji);font-weight:700;font-size:60px;line-height:1;color:var(--luna);}
.fuente{position:absolute;left:72px;bottom:72px;font-family:var(--dato);font-size:18px;letter-spacing:.12em;color:var(--niebla);}
.fila{border-top:1px solid var(--filete);padding:20px 0 22px;}
.fila:last-child{border-bottom:1px solid var(--filete);}
.lab{font-family:var(--dato);font-size:18px;letter-spacing:.14em;color:var(--niebla);margin-bottom:8px;}
.val{font-family:var(--dato);font-weight:500;font-size:28px;letter-spacing:.03em;color:var(--luna);text-transform:uppercase;}
`;


// ── Ornamentos góticos-románticos ─────────────────────────────────────────
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

// Puntilla de encaje en el borde superior: festones, ojales y una línea de puntos.
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

const grano = '<div class="grano"></div>';
const vhs = t => `<div class="vhs"><span class="rec"></span>▶ PLAY&nbsp;&nbsp;${t}</div>`;
const filas = rows => rows.map(([l, v, color]) =>
  `<div class="fila"><div class="lab">${l}</div><div class="val"${color ? ` style="color:var(--${color})"` : ''}>${v}</div></div>`).join('');
const arcoFoto = (img, fallback = '') => img
  ? `<img class="foto" src="${img}" style="object-position:center top">`
  : fallback;

function portada(s, img, media, total) {
  const p = s.portada;
  const fallback = `
      <div style="position:absolute;left:0;right:0;top:120px;text-align:center;font-family:var(--kanji);font-weight:700;font-size:290px;line-height:1;color:var(--plata)">${p.kanji ?? '夜'}</div>
      <div style="position:absolute;left:50%;transform:translateX(-50%);bottom:44px;white-space:nowrap;font-family:var(--kanji);font-weight:700;font-size:30px;letter-spacing:.3em;color:var(--plata);opacity:.8">${media.title.native ?? ''}</div>`;
  return `
<div class="slide">
  ${puntilla()}
  <div class="vhs"><span class="rec"></span>▶ PLAY&nbsp;&nbsp;ENTREGA Nº ${s.numero}</div>
  <div class="der" style="color:var(--plata)">@CABA.KAMI</div>
  <div class="luna-c" style="left:520px;top:104px"></div>
  ${arco(270, 150, 540, 600, arcoFoto(img, fallback))}
  ${destellos([[226, 330, 30], [858, 446, 20], [214, 540, 12, .7], [872, 262, 13, .7]])}
  <div style="position:absolute;left:72px;right:200px;bottom:150px">
    <div class="banda">${p.banda ?? 'ENTREGA DE ANIME'}</div>
    <div class="etq" style="margin:26px 0 14px">${p.romaji}</div>
    <h1>${p.titulo.join('<br>')}</h1>
    <div class="bajada" style="margin-top:22px">${p.bajada}</div>
  </div>
  <div class="etq" style="position:absolute;left:72px;bottom:72px;font-size:18px">DESLIZA →</div>
  <div class="sello"><span>神</span></div>
  ${grano}
</div>`;
}

function ficha(s, total) {
  const f = s.ficha;
  return `
<div class="slide" style="background:var(--humo)">
  <div class="fantasma" style="left:-60px;bottom:-90px;font-size:560px">夜</div>
  ${puntilla()}
  ${vhs('00:02')}<div class="der">2 / ${total}</div>
  <h2 style="position:absolute;left:72px;top:140px">La ficha técnica</h2>
  ${arco(72, 270, 400, 560, `
      <div class="etq" style="font-size:17px;margin-top:110px">${f.cifraArriba}</div>
      <div style="font-family:var(--dato);font-weight:500;font-size:150px;line-height:1;color:var(--vino-vivo);margin:14px 0 4px">${f.cifra}</div>
      <div style="font-family:var(--dato);font-weight:500;font-size:30px;letter-spacing:.2em;color:var(--luna)">${f.cifraUnidad}</div>
      <div class="etq" style="font-size:17px;line-height:1.5;margin-top:24px;letter-spacing:.08em;color:var(--plata)">${f.cifraAbajo.join('<br>')}</div>`,
      'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 30px;box-sizing:border-box')}
  ${destellos([[466, 300, 18], [92, 862, 12, .7]])}
  <div style="position:absolute;left:520px;right:72px;top:270px">${filas(f.filas)}</div>
  <div class="cuerpo" style="position:absolute;left:72px;right:72px;top:890px;background:var(--noche);border:1px solid var(--filete);padding:36px 40px;font-size:31px">${f.frase}</div>
  <div class="fuente" style="left:auto;right:72px">${f.fuente}</div>
  ${grano}
</div>`;
}

function deQueVa(s, img, total) {
  const d = s.deQueVa;
  return `
<div class="slide">
  <div class="fantasma" style="left:-60px;bottom:-90px;font-size:520px">${d.kanji ?? '毒'}</div>
  ${puntilla()}
  ${vhs('00:03')}<div class="der">3 / ${total}</div>
  ${arco(640, 200, 368, 560, arcoFoto(img))}
  ${destellos([[624, 300, 24], [1022, 520, 14, .8], [650, 720, 10, .6]])}
  <div class="etq" style="position:absolute;left:640px;top:785px;width:368px;text-align:center;color:var(--plata)">${d.etiquetaProta}</div>
  <div style="position:absolute;left:72px;width:520px;top:200px">
    <div class="etq" style="color:var(--plata)">SIN SPOILERS</div>
    <h2 style="margin:20px 0 70px">De qué va</h2>
    <div class="cuerpo capitular" style="max-width:520px;font-size:33px">${d.parrafo}</div>
    <div style="margin:44px 0">${separador(240)}</div>
    <div class="cuerpo" style="max-width:900px;font-size:33px">${d.remate}</div>
  </div>
  <div class="luna-c" style="left:72px;bottom:96px"></div>
  ${grano}
</div>`;
}

function porQue(s, total) {
  const q = s.porQue;
  const items = q.items.map((t, i) => `
    <div style="display:flex;gap:36px;border-top:1px solid var(--filete);padding-top:44px${i === q.items.length - 1 ? ';border-bottom:1px solid var(--filete);padding-bottom:44px' : ''}">
      <div style="font-family:var(--dato);font-weight:500;font-size:64px;line-height:1;color:var(--vino-vivo)">0${i + 1}</div>
      <div class="cuerpo" style="font-size:36px">${t}</div>
    </div>`).join('');
  return `
<div class="slide" style="background:var(--humo)">
  <div class="fantasma" style="right:-60px;bottom:-90px;font-size:560px">夜</div>
  ${puntilla()}
  ${vhs('00:04')}<div class="der">4 / ${total}</div>
  <h2 style="position:absolute;left:72px;top:150px">Por qué engancha</h2>
  ${destellos([[560, 168, 22], [600, 214, 11, .7]])}
  <div style="position:absolute;left:72px;right:72px;top:330px;display:flex;flex-direction:column;gap:44px">${items}</div>
  ${q.fuente ? `<div class="fuente">${q.fuente}</div>` : ''}
  ${grano}
</div>`;
}

function husbando(s, img, total) {
  const hb = s.husbando;
  return `
<div class="slide">
  <div class="fantasma" style="right:-60px;bottom:-80px;font-size:600px">恋</div>
  ${puntilla()}
  ${vhs('00:05')}<div class="der">5 / ${total}</div>
  <div style="position:absolute;left:72px;top:170px"><div class="banda plata">ALERTA HUSBANDO</div></div>
  ${arco(700, 150, 308, 420, arcoFoto(img))}
  ${destellos([[686, 200, 30], [1024, 330, 18], [690, 470, 12, .7], [360, 300, 20], [400, 262, 10, .7]])}
  <h2 style="position:absolute;left:72px;top:250px;font-size:120px">${hb.nombre}</h2>
  <div class="bajada" style="position:absolute;left:72px;top:390px;width:580px;color:var(--plata)">${hb.bajada}</div>
  <div style="position:absolute;left:72px;right:72px;top:610px">${filas(hb.filas)}</div>
  ${grano}
</div>`;
}

function cierre(s) {
  const c = s.cierre;
  return `
<div class="slide" style="background:var(--vino)">
  <div class="fantasma" style="right:-30px;top:60px;font-size:640px;opacity:.06">夜</div>
  ${puntilla(.4)}
  <div class="vhs" style="color:var(--plata)"><span style="width:14px;height:14px;background:var(--plata)"></span>STOP&nbsp;&nbsp;FIN DE LA ENTREGA</div>
  <svg width="936" height="800" style="position:absolute;left:72px;top:210px;overflow:visible"><path d="${ojiva(936, 800)}" style="fill:none;stroke:var(--plata);stroke-width:2"/></svg>
  <div class="luna-c" style="left:516px;top:160px;width:40px;height:40px;box-shadow:12px -3px 0 0 var(--plata)"></div>
  ${destellos([[230, 520, 24], [860, 640, 18], [262, 690, 11, .7], [840, 470, 12, .7]])}
  <div style="position:absolute;left:150px;right:150px;top:470px;text-align:center">
    <h2 style="font-size:96px;line-height:.98">${c.pregunta.join('<br>')}</h2>
    <div class="cuerpo" style="margin:40px auto 0;max-width:660px;font-size:31px">${c.texto}</div>
  </div>
  <div style="position:absolute;left:72px;right:72px;bottom:240px;display:flex;justify-content:center;gap:28px;font-family:var(--dato);font-size:22px;letter-spacing:.16em;color:var(--plata)"><span>GUARDAR</span><span>✦</span><span>COMPARTIR</span><span>✦</span><span>COMENTAR</span></div>
  <div style="position:absolute;left:72px;right:72px;bottom:72px;display:flex;justify-content:space-between;align-items:center">
    <div style="font-family:var(--display);font-style:italic;font-weight:600;font-size:56px">caba<span style="color:var(--plata)">.</span>kami</div>
    <div style="width:96px;height:96px;background:var(--noche);border-radius:6px;display:grid;place-items:center;box-shadow:inset 0 0 0 4px var(--noche),inset 0 0 0 6px var(--plata)"><span style="font-family:var(--kanji);font-weight:700;font-size:60px;line-height:1">神</span></div>
  </div>
  ${grano}
</div>`;
}

// Devuelve el HTML completo con una diapositiva por cada <div class="slide">.
export function buildEntrega(spec, imgs, media) {
  const total = 6;
  const slides = [
    portada(spec, imgs.portada, media, total),
    ficha(spec, total),
    deQueVa(spec, imgs.prota, total),
    porQue(spec, total),
    husbando(spec, imgs.husbando, total),
    cierre(spec),
  ];
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
${FONTS.map(f => `<link rel="stylesheet" href="${f}">`).join('\n')}
<style>${CSS}</style></head><body>${slides.join('\n')}</body></html>`;
}
