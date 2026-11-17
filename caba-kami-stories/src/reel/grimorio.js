// Plantilla de reel «grimorio» (v2) de @caba.kami: las brujitas del Aquelarre explican anime.
// Es la plantilla de los reels explicativos, distinta a propósito de la de lista:
//   · pixel art de juego de los 90 (escena de 180×320 píxeles ampliada a 1080×1920)
//   · lenguaje de anime: brujitas con ojos de anime y gestos (gota de sudor, venita, lágrimas a
//     chorro, ojos brillantes, «!» y «?»), onomatopeyas en japonés, líneas de impacto de manga y
//     portadas reales de anime en el espejo mágico y en la tele
//   · ritmo de redes: gancho en el primer segundo, subtítulos grandes palabra por palabra al ritmo
//     de la voz en off, zoom de golpe en cada revelación y cortes que varían (iris, barrido, flash)
//   · vals de bruja propio que baja solo cuando habla la narradora
//
// buildReelGrimorio(spec, imgs, bpm, voces) → { html, eventos, cortes, duracion, colocacion }
//   voces: { intro, escenas: [], cierre }, cada una { dur, env (volumen a 12 fps), palabras [{w, t, d}] }
//   colocacion: [{clave, t}] dónde suena cada clip de voz.

import { FONTS, CSS, enfasis } from '../carrusel/plantilla.js';
import { sello } from './plantilla.js';

const ESCALA = 6;
const W = 180, H = 320;
const ONOMATOPEYAS = ['ドン！', 'キラッ', 'ジャーン', 'バーン！', 'ズキュン'];

const G_CSS = `
body{margin:0;background:#000;}
.reel{width:1080px;height:1920px;position:relative;overflow:hidden;background:#0b0a0d;color:var(--luna);}
.camara{position:absolute;inset:0;transform-origin:540px 620px;}
canvas.px{position:absolute;left:0;top:0;width:1080px;height:1920px;image-rendering:pixelated;}
.capa{position:absolute;inset:0;}
.esc{position:absolute;inset:0;display:none;}
.cab{position:absolute;left:60px;right:60px;top:96px;text-align:center;}
.cab .num{display:inline-block;font-family:var(--dato);font-size:26px;letter-spacing:.12em;color:var(--luna);background:var(--vino);padding:8px 16px 6px;}
.cab h2{margin:16px 0 0;font-family:var(--display);font-weight:400;font-size:84px;line-height:1;color:var(--luna);}
.cab h2 em{font-style:italic;color:var(--plata);}
.etq{position:absolute;transform:translate(-50%,-50%);font-family:var(--dato);color:var(--luna);white-space:nowrap;text-align:center;letter-spacing:.04em;opacity:0;}
.sticker{position:absolute;left:50%;top:1290px;transform:translateX(-50%) rotate(-3deg);background:var(--luna);color:var(--noche);font-family:var(--display);font-size:62px;line-height:1;padding:16px 34px 14px;white-space:nowrap;box-shadow:8px 8px 0 var(--vino);opacity:0;}
.sticker em{font-style:italic;color:var(--vino);}
.ono{position:absolute;font-family:var(--kanji);font-weight:700;font-size:136px;line-height:1;color:var(--luna);-webkit-text-stroke:10px var(--vino);paint-order:stroke fill;opacity:0;white-space:nowrap;}
.subs{position:absolute;left:70px;right:70px;top:1440px;height:250px;}
.subs .chunk{position:absolute;left:0;right:0;top:50%;text-align:center;font-family:var(--texto);font-weight:700;font-size:74px;line-height:1.12;color:var(--luna);text-shadow:0 6px 0 #000,0 0 24px rgba(0,0,0,.8);opacity:0;transform-origin:50% 50%;}
.subs .p{display:inline-block;margin:0 .1em;}
.subs .p.ahora{color:var(--vino-vivo);}
.titulo{position:absolute;left:60px;right:60px;text-align:center;}
.titulo .sup{display:inline-block;font-family:var(--dato);font-size:28px;letter-spacing:.12em;color:var(--luna);background:var(--vino);padding:8px 16px 6px;}
.titulo h1{margin:20px 0 0;font-family:var(--display);font-weight:400;font-size:112px;line-height:.92;}
.titulo h1 em{font-style:italic;color:var(--plata);}
.titulo .cta{margin-top:30px;font-family:var(--dato);font-size:30px;letter-spacing:.1em;color:var(--plata);}
`;

const aPulsos = (seg, b, min) => Math.max(min, Math.ceil(seg / b)) * b;

// Subtítulos: grupos de hasta 3 palabras (o unas 18 letras), cortando en la puntuación.
function grupos(palabras = []) {
  const g = []; let act = [];
  for (const p of palabras) {
    act.push(p);
    const largo = act.map(x => x.w).join(' ').length;
    if (act.length >= 3 || largo >= 16 || /[.,;:!?…]$/.test(p.w)) { g.push(act); act = []; }
  }
  if (act.length) g.push(act);
  return g;
}

function subtitulos(voz) {
  if (!voz?.palabras?.length) return '';
  const gs = grupos(voz.palabras);
  return `<div class="subs">${gs.map((g, i) => {
    const t0 = voz.t + g[0].t, t1 = i + 1 < gs.length ? voz.t + gs[i + 1][0].t : voz.t + voz.dur + .25;
    return `<div class="chunk" data-t0="${t0.toFixed(3)}" data-t1="${t1.toFixed(3)}">${g.map(p =>
      `<span class="p" data-t="${(voz.t + p.t).toFixed(3)}">${p.w}</span>`).join(' ')}</div>`;
  }).join('')}</div>`;
}

export function buildReelGrimorio(spec, imgs = {}, bpm = 96, voces = {}) {
  const b = 60 / bpm;
  const ENTRADA = .3;
  const partes = [], colocacion = [], cortes = [], eventos = [];
  let t = 0;

  // GANCHO: la voz arranca casi de inmediato y el espejo mágico pasa portadas de anime.
  const vi = voces.intro;
  const dIntro = aPulsos(.15 + (vi?.dur ?? 2.5) + .3, b, 4);
  partes.push({ tipo: 'intro', t0: 0, t1: dIntro, conjuro: .05, voz: vi ? { t: .15, ...vi } : null,
    objeto: { tipo: 'espejo', fotos: spec.intro?.fotos ?? Object.keys(imgs) }, brujas: spec.intro?.brujas ?? [{ id: 'vidente', poses: ['varita', 'senala'] }] });
  if (vi) colocacion.push({ clave: 'intro', t: .15 });
  eventos.push({ tipo: 'impacto', t: .05, vol: .8 }, { tipo: 'campana', t: .15 });
  t = dIntro; cortes.push(t);

  // LECCIONES
  spec.escenas.forEach((e, i) => {
    const v = voces.escenas?.[i];
    const d = aPulsos(ENTRADA + (v?.dur ?? 3.5) + .3, b, 4);
    const conjuro = t + .12;
    partes.push({ tipo: 'escena', i, t0: t, t1: t + d, conjuro, voz: v ? { t: t + ENTRADA, ...v } : null, e,
      objeto: e.objeto, brujas: e.brujas, foto: e.foto });
    if (v) colocacion.push({ clave: `escena-${i}`, t: t + ENTRADA });
    eventos.push({ tipo: ['pagina', 'eyecatch', 'impacto'][i % 3], t: t - .06, vol: .7 },
      { tipo: 'impacto', t: conjuro + .04, vol: .55 }, { tipo: 'campana', t: conjuro + .12, vol: .8 });
    t += d; cortes.push(t);
  });

  // CIERRE
  const vc = voces.cierre;
  const dCierre = aPulsos(.3 + (vc?.dur ?? 2.2) + 1.6, b, 5);
  const golpe = t + Math.max(1.2, .3 + (vc?.dur ?? 2) + .2);
  partes.push({ tipo: 'cierre', t0: t, t1: t + dCierre, voz: vc ? { t: t + .3, ...vc } : null, golpe,
    brujas: [{ id: 'vidente', poses: ['celebra'] }, { id: spec.cierre?.bruja ?? 'mensajera', poses: ['celebra'] }] });
  if (vc) colocacion.push({ clave: 'cierre', t: t + .3 });
  eventos.push({ tipo: 'pagina', t: t - .06 }, { tipo: 'sello', t: golpe });
  const duracion = t + dCierre;

  // ── Texto nítido sobre el lienzo ──
  const htmlPartes = partes.map(p => {
    const subs = subtitulos(p.voz);
    if (p.tipo === 'intro') return `<div class="esc" data-in="${p.t0}" data-out="${p.t1}">
      <div class="cab" data-golpe="0.05"><div class="num">${spec.etiqueta ?? 'EL GRIMORIO DEL AQUELARRE'}</div><h2>${(spec.titulo ?? []).map(enfasis).join(' ')}</h2></div>
      <div class="ono" data-ono="0.1" style="right:50px;top:620px;transform:rotate(8deg)">${spec.intro?.onomatopeya ?? 'ゴゴゴ'}</div>
      ${subs}</div>`;
    if (p.tipo === 'cierre') return `<div class="esc" data-in="${p.t0}" data-out="${p.t1 + 1}">
      <div class="titulo" style="top:330px" data-golpe="${p.t0 + .1}">
        <div class="sup">${spec.cierre.etiqueta ?? 'TU TURNO'}</div>
        <h1>${spec.cierre.pregunta.map(enfasis).join('<br>')}</h1>
        <div class="cta">${spec.cierre.cta ?? ''}</div>
      </div>
      <div style="position:absolute;left:0;right:0;top:1290px;display:flex;justify-content:center;align-items:center;gap:30px">
        <div data-golpe="${p.t0 + .9}" style="font-family:var(--display);font-style:italic;font-size:84px;opacity:0">caba<span style="color:var(--vino-vivo)">.</span>kami</div>
        ${sello(p.golpe - .32)}
      </div>
      ${subs}</div>`;
    const e = p.e;
    const etqs = etiquetasObjeto(e.objeto).map(x =>
      `<div class="etq" data-golpe="${p.conjuro + .3 + (x.retraso ?? 0)}" style="left:${x.x * ESCALA}px;top:${x.y * ESCALA}px;font-size:${x.size ?? 24}px${x.color ? `;color:${x.color}` : ''}">${x.texto}</div>`).join('');
    const ono = e.onomatopeya ?? ONOMATOPEYAS[p.i % ONOMATOPEYAS.length];
    return `<div class="esc" data-in="${p.t0}" data-out="${p.t1}">
      <div class="cab" data-golpe="${p.t0 + .02}"><div class="num">LECCIÓN ${String(p.i + 1).padStart(2, '0')}${spec.tema ? ` · ${spec.tema}` : ''}</div><h2>${enfasis(e.titulo ?? '')}</h2></div>
      ${etqs}
      <div class="ono" data-ono="${p.conjuro + .02}" style="${p.i % 2 ? 'left' : 'right'}:60px;top:${p.i % 2 ? 330 : 360}px;transform:rotate(${p.i % 2 ? -8 : 8}deg)">${ono}</div>
      ${e.dato ? `<div class="sticker" data-golpe="${p.conjuro + .9}">${enfasis(e.dato)}</div>` : ''}
      ${subs}</div>`;
  }).join('\n');

  const datos = {
    partes: partes.map(p => ({ tipo: p.tipo, i: p.i, t0: p.t0, t1: p.t1, conjuro: p.conjuro, golpe: p.golpe,
      voz: p.voz ? { t: p.voz.t, dur: p.voz.dur, env: p.voz.env } : null, objeto: p.objeto ?? null, brujas: p.brujas ?? null, foto: p.foto ?? null })),
    cortes,
  };
  const fotos = Object.fromEntries(Object.entries(imgs).filter(([, v]) => v));

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
${FONTS.map(f => `<link rel="stylesheet" href="${f}">`).join('\n')}
<style>${CSS}${G_CSS}</style></head><body>
<div class="reel"><div class="camara" id="camara">
  <canvas class="px" id="lienzo" width="${W}" height="${H}"></canvas>
  <div class="capa">${htmlPartes}</div>
</div>
  <canvas class="px" id="iris" width="${W}" height="${H}"></canvas>
</div>
<script>
const DATOS = ${JSON.stringify(datos)};
const FOTOS = ${JSON.stringify(fotos)};
${MOTOR}
</script></body></html>`;
  return { html, eventos, cortes, duracion, colocacion };
}

// Rótulos de texto de cada objeto, en coordenadas de la escena pixelada.
function etiquetasObjeto(o) {
  if (!o) return [];
  const cx = 90, cy = 96;
  switch (o.tipo) {
    case 'calendario': return (o.etiquetas ?? ['ENE–MAR', 'ABR–JUN', 'JUL–SEP', 'OCT–DIC']).map((n, i) => ({ texto: n, x: cx - 51 + i * 34, y: cy - 22, size: 21, retraso: i * .08 }))
      .concat([0, 1, 2, 3].map(i => ({ texto: String(i + 1), x: cx - 51 + i * 34, y: cy + 4, size: 64, retraso: .15 + i * .08 })));
    case 'tira': { const n = o.episodios ?? 12, cols = Math.min(n, 6);
      return Array.from({ length: n }, (_, i) => ({ texto: String(i + 1), x: cx - 50 + (i % cols) * 20, y: cy - 10 + Math.floor(i / cols) * 22, size: 34, retraso: i * .06 })); }
    case 'tijeras': return [{ texto: o.izquierda ?? 'PARTE 1', x: cx - 33, y: cy - 2, size: 26 }, { texto: o.derecha ?? 'PARTE 2', x: cx + 33, y: cy - 2, size: 26 },
      ...(o.pausa ? [{ texto: o.pausa, x: cx, y: cy + 30, size: 26, color: 'var(--vino-vivo);background:#0e0d0f;padding:4px 12px', retraso: .4 }] : [])];
    case 'tele': return o.pantalla ? [{ texto: o.pantalla, x: cx - 7, y: cy + 21, size: 24, retraso: .3 }] : [];
    case 'reloj': return o.texto ? [{ texto: o.texto, x: cx, y: cy + 36, size: 30, retraso: .3 }] : [];
    case 'estudio': return [{ texto: o.letrero ?? 'ESTUDIO', x: cx, y: cy - 18, size: 26 }];
    default: return [];
  }
}

// ── Motor (lado navegador) ──────────────────────────────────────────────────
const MOTOR = String.raw`
const W = 180, H = 320;
const C = { noche:"#0e0d0f", humo:"#201e21", alto:"#2e2b2f", vino:"#6b1528", vivo:"#b8304d", plata:"#c9c7cb", luna:"#ecebee", niebla:"#8c8a90", filete:"#3d3a3f",
  muro:"#17151a", muro2:"#1c1a20", suelo:"#111013", piel:"#efe3dc", negro:"#08070a", sombrero:"#2a2530", sombrero2:"#463f4c" };
const cv = document.getElementById('lienzo'), ctx = cv.getContext('2d');
const iv = document.getElementById('iris'), ictx = iv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w || 1, h || 1); };
const hash = n => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
const clamp = x => x < 0 ? 0 : x > 1 ? 1 : x;
const outBack = x => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

const IMGS = {};
Object.entries(FOTOS).forEach(([k, src]) => { const im = new Image(); im.src = src; IMGS[k] = im; });
function foto(k, x, y, w, h) {
  const im = IMGS[k];
  if (!im || !im.complete || !im.naturalWidth) { px(x, y, w, h, C.alto); return; }
  const ar = w / h, iw = im.naturalWidth, ih = im.naturalHeight, sw = Math.min(iw, ih * ar), sh = sw / ar;
  ctx.imageSmoothingEnabled = true; ctx.drawImage(im, (iw - sw) / 2, Math.max(0, (ih - sh) * .25), sw, sh, x, y, w, h); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = 'rgba(107,21,40,.12)'; ctx.fillRect(x, y, w, h);
}

// ── Brujas con cara de anime ──
const BRUJAS = {
  vidente:   { tunica: C.vino,    pelo: C.plata,   iris: '#8a4aa0', objeto: 'bola' },
  escriba:   { tunica: C.alto,    pelo: '#3a2c32', iris: '#4a6aa0', objeto: 'pluma' },
  guardiana: { tunica: '#2a2430', pelo: C.luna,    iris: '#a04a4a', objeto: 'farol' },
  cronista:  { tunica: '#3d0f1b', pelo: C.niebla,  iris: '#4aa07a', objeto: 'libro' },
  mensajera: { tunica: '#1b181e', pelo: C.vivo,    iris: '#a07a4a', objeto: 'carta' },
};
const S = 3;   // cada «píxel» del muñeco son 3 de la escena; la cara lleva detalle fino de 1

function bruja(id, x, y, pose, t, espejo, boca) {
  const B = BRUJAS[id] || BRUJAS.vidente;
  const salto = pose === 'celebra' ? -Math.abs(Math.sin(t * 7)) * 8 : (pose === 'sorpresa' ? -3 : 0);
  const bob = Math.floor(t * 2) % 2;
  const ox = x - 7 * S, oy = Math.round(y - 26 * S + bob + salto);
  const q = (a, r, w, h, c) => { w = w || 1; const xx = espejo ? 15 - a - w : a; px(ox + xx * S, oy + r * S, w * S, (h || 1) * S, c); };
  const f = (dx, dy, w, h, c) => { const xx = espejo ? ox + 15 * S - dx - w : ox + dx; px(xx, oy + dy, w, h, c); };
  px(x - 18, y + 1, 36, 3, 'rgba(0,0,0,.55)');
  // Sombrero: punta doblada, banda plata, ala ancha
  q(10, 0, 1, 1, C.sombrero); q(8, 1, 2, 1, C.sombrero);
  [[7, 8], [6, 8], [6, 9], [5, 9], [5, 10]].forEach(([a, b2], r) => { q(a, r + 2, b2 - a + 1, 1, C.sombrero); q(a, r + 2, 1, 1, C.sombrero2); });
  q(4, 6, 7, 1, C.plata); q(0, 7, 15, 1, C.sombrero); q(1, 8, 13, 1, C.sombrero2);
  // Pelo, cara y flequillo en puntas
  q(3, 8, 9, 1, B.pelo);
  for (let r = 9; r <= 14; r++) { q(3, r, 2, 1, B.pelo); q(10, r, 2, 1, B.pelo); if (r <= 13) q(5, r, 5, 1, C.piel); }
  q(3, 15, 2, 2, B.pelo); q(10, 15, 2, 2, B.pelo);
  f(15, 27, 15, 2, B.pelo); f(16, 29, 2, 2, B.pelo); f(21, 29, 3, 1, B.pelo); f(27, 29, 2, 2, B.pelo);
  // Ojos de anime: pestaña, iris grande y dos brillos; en arco cuando celebra o parpadea
  const parpadeo = ((t * 1.3 + x * .07) % 3.4) < .09;
  const ojo = dx => {
    if (parpadeo || pose === 'celebra') { f(dx, 33, 4, 1, C.negro); f(dx - 1, 32, 1, 1, C.negro); f(dx + 4, 32, 1, 1, C.negro); return; }
    if (pose === 'triste' || pose === 'llora') { f(dx - 1, 32, 6, 1, C.negro); f(dx, 33, 4, 3, B.iris); f(dx + 1, 34, 2, 2, C.negro); f(dx, 33, 1, 1, C.luna); return; }
    f(dx - 1, 30, 6, 1, C.negro); f(dx, 31, 4, 5, B.iris); f(dx + 1, 32, 2, 4, C.negro); f(dx, 31, 2, 2, C.luna); f(dx + 3, 34, 1, 1, C.luna);
    if (pose === 'sorpresa') { f(dx, 31, 4, 5, C.luna); f(dx + 1, 33, 2, 2, C.negro); }
  };
  ojo(17); ojo(24);
  f(16, 36, 3, 1, '#e8a0ac'); f(26, 36, 3, 1, '#e8a0ac');
  // Boca (se abre con la voz)
  if (boca || pose === 'sorpresa' || pose === 'celebra') { f(21, 37, 4, 3, '#5a1424'); f(22, 39, 2, 1, '#d46a7c'); }
  else if (pose === 'llora' || pose === 'triste') { f(21, 38, 4, 1, '#5a1424'); f(20, 39, 1, 1, '#5a1424'); f(25, 39, 1, 1, '#5a1424'); }
  else { f(22, 38, 2, 1, '#5a1424'); f(21, 37, 1, 1, '#5a1424'); f(24, 37, 1, 1, '#5a1424'); }
  // Túnica
  q(4, 15, 7, 1, B.tunica); q(6, 15, 3, 1, C.plata);
  for (let r = 16; r <= 23; r++) { const e = Math.floor((r - 16) / 3); q(4 - e, r, 7 + 2 * e, 1, B.tunica); }
  for (let a = 2; a < 13; a += 2) q(a, 23, 1, 1, C.plata);
  q(5, 24, 2, 2, C.negro); q(8, 24, 2, 2, C.negro);
  // Brazos
  const manga = (pts, mano) => { pts.forEach(([a, r]) => q(a, r, 2, 2, B.tunica)); q(mano[0], mano[1], 1, 1, C.piel); return mano; };
  let izq;
  switch (pose) {
    case 'varita': manga([[11, 15], [12, 13], [13, 11]], [14, 10]); q(14, 6, 1, 4, C.luna);
      { const ch = Math.floor(t * 8) % 2; q(14 - ch, 4 + ch, 1, 1, C.plata); q(15, 5 - ch, 1, 1, C.luna); } izq = manga([[2, 16], [2, 18]], [2, 20]); break;
    case 'senala': manga([[11, 16], [13, 15], [15, 14]], [17, 14]); izq = manga([[2, 16], [2, 18]], [2, 20]); break;
    case 'sorpresa': case 'celebra': manga([[11, 15], [12, 13], [13, 11]], [14, 10]); izq = manga([[2, 15], [1, 13], [0, 11]], [0, 10]); break;
    case 'pensar': manga([[11, 16], [11, 14]], [10, 13]); izq = manga([[2, 16], [3, 18]], [5, 19]); break;
    case 'llora': manga([[11, 15], [10, 13]], [9, 12]); izq = manga([[2, 15], [3, 13]], [5, 12]); break;
    case 'encoge': manga([[11, 15], [13, 14]], [15, 13]); izq = manga([[2, 15], [0, 14]], [-1, 13]); break;
    case 'enfado': manga([[11, 16], [12, 18]], [11, 19]); izq = manga([[2, 16], [2, 18]], [3, 19]); break;
    default: manga([[11, 16], [11, 18]], [12, 20]); izq = manga([[2, 16], [2, 18]], [2, 20]);
  }
  const [ha, hr] = izq;
  if (B.objeto === 'bola' && ['varita', 'senala', 'parado', 'pensar'].includes(pose)) { const g = Math.sin(t * 3) > 0; q(ha - 2, hr, 3, 3, C.plata); q(ha - 1, hr + 1, 1, 1, g ? C.luna : C.vivo); }
  if (B.objeto === 'libro' && (pose === 'parado' || pose === 'senala')) { q(ha - 3, hr, 4, 4, C.vino); q(ha - 3, hr, 1, 4, C.plata); }
  if (B.objeto === 'carta') { q(11, 10, 3, 2, C.negro); q(13, 10, 1, 1, C.niebla); }
  // Gestos de anime
  const top = oy - 4, fase = Math.floor(t * 6), lado = espejo ? -1 : 1;
  switch (pose) {
    case 'sorpresa':
      px(x - 2, top - 16 + (fase % 2), 4, 11, C.vivo); px(x - 2, top - 3 + (fase % 2), 4, 4, C.vivo);
      for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * .5; px(x + Math.cos(a) * 28, top + 16 + Math.sin(a) * 26, 2, 3, C.luna); } break;
    case 'pensar': // «?»
      px(x + 16 * lado - 4, top - 14, 8, 2, C.luna); px(x + 16 * lado + 2, top - 12, 2, 4, C.luna); px(x + 16 * lado - 2, top - 8, 4, 2, C.luna); px(x + 16 * lado - 2, top - 2, 2, 2, C.luna); break;
    case 'encoge': { const yy = oy + 22 + (fase % 3); const gx = x - 24 * lado; px(gx, yy, 3, 4, '#a9c8ff'); px(gx + 1, yy - 2, 1, 2, '#a9c8ff'); break; }
    case 'enfado': { const vx = x + 14 * lado, vy = top + 8, c = C.vivo; px(vx, vy, 2, 6, c); px(vx + 4, vy, 2, 6, c); px(vx - 2, vy + 2, 10, 2, c); break; }
    case 'llora': for (let k = 0; k < 2; k++) { const ex = espejo ? ox + 15 * S - (k ? 26 : 18) : ox + (k ? 25 : 17); for (let yy = 0; yy < 24; yy += 2) px(ex + ((yy / 2 + fase) % 2), oy + 36 + yy, 2, 2, '#a9c8ff'); } break;
    case 'triste': for (let k = 0; k < 5; k++) px(ox + 15 + k * 3, oy + 26, 1, 6, 'rgba(70,80,140,.9)'); break;
    case 'celebra': for (let k = 0; k < 6; k++) { const a = t * 3 + k * 1.05, rr = 30 + (k % 2) * 6, sx = x + Math.cos(a) * rr, sy = top + 30 + Math.sin(a) * rr * .6;
      px(sx - 1, sy, 3, 1, k % 2 ? C.luna : C.plata); px(sx, sy - 1, 1, 3, k % 2 ? C.luna : C.plata); } break;
  }
}

// ── Escenario: la torre del Aquelarre ──
const ESTRELLAS = Array.from({ length: 40 }, (_, i) => ({ x: (i * 47) % 180, y: 4 + (i * 29) % 130, f: i * .9 }));
function cuarto(t, atenuar) {
  px(0, 0, W, H, '#0b0a0d');
  px(0, 46, W, 136, C.muro);
  for (let y = 50; y < 182; y += 8) for (let x = (y / 8) % 2 ? 0 : 8; x < W; x += 16) { px(x, y, 1, 7, C.muro2); px(x, y + 7, 15, 1, C.muro2); }
  px(0, 182, W, 26, C.suelo);
  for (let y = 182; y < 208; y += 9) px(0, y, W, 1, '#19171c');
  const vx = 62, vw = 56, vy = 54, vh = 84, r = .75 * vw, rise = Math.sqrt(r * r - (r - vw / 2) ** 2);
  for (let y = 0; y < vh; y++) {
    const x0 = y < rise ? r - Math.sqrt(Math.max(0, r * r - (rise - y) ** 2)) : 0;
    px(vx + x0, vy + y, vw - 2 * x0, 1, '#0a0910'); px(vx + x0 - 1, vy + y, 1, 1, C.plata); px(vx + vw - x0, vy + y, 1, 1, C.plata);
  }
  ESTRELLAS.forEach(s => { if (s.x > vx + 3 && s.x < vx + vw - 3 && s.y > vy + 12 && s.y < vy + vh) { const b = .5 + .5 * Math.sin(t * 2 + s.f); if (b > .4) px(s.x, s.y, 1, 1, b > .8 ? C.luna : C.niebla); } });
  for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if (x * x + y * y <= 36 && (x - 3) ** 2 + (y + 1) ** 2 > 24) px(98 + x, 74 + y, 1, 1, C.luna);
  px(vx, vy + 56, vw, 1, C.plata); px(vx + vw / 2, vy + 20, 1, vh - 20, C.plata);
  [20, 160].forEach((x, i) => { px(x - 3, 104, 7, 2, C.filete); px(x - 1, 94, 3, 10, C.luna); const fl = Math.sin(t * 9 + i) > 0 ? 1 : 0; px(x - fl, 89, 2, 4, C.vivo); px(x, 88 - fl, 1, 2, C.plata); });
  if (atenuar) { ctx.fillStyle = 'rgba(11,10,13,' + (.8 * atenuar) + ')'; ctx.fillRect(0, 46, W, 136); }
  const cx = 90, cy = 206;
  for (let i = 0; i < 7; i++) { const h = 2 + ((Math.sin(t * 10 + i * 1.7) + 1) * 1.6); px(cx - 10 + i * 3, cy - h + 1, 2, h, i % 2 ? C.vivo : C.vino); }
  for (let rr = 0; rr < 16; rr++) { const w = Math.round(28 - Math.pow(Math.abs(rr - 6) / 8, 2) * 12); px(cx - w / 2, cy - 18 + rr, w, 1, rr < 2 ? '#1d1b20' : '#141216'); }
  px(cx - 15, cy - 20, 30, 2, C.filete); px(cx - 14, cy - 21, 28, 1, C.plata); px(cx - 12, cy - 23, 24, 2, C.vino); px(cx - 10, cy - 24, 20, 1, C.vivo);
  for (let i = 0; i < 6; i++) { const ph = (t * .8 + i * .37) % 1; px(cx - 8 + ((i * 7) % 17) + Math.sin(ph * 9) * 2, cy - 24 - ph * 22, 1, 1, ph > .6 ? C.niebla : C.plata); }
  px(0, 44, W, 2, C.filete); px(0, 208, W, 2, C.filete);
}

// Líneas de impacto de manga, del borde hacia el objeto
function impacto(tc) {
  if (tc < 0 || tc > .5) return;
  const a = 1 - tc / .5;
  for (let k = 0; k < 44; k++) { const ang = hash(k + 3) * Math.PI * 2, r0 = 66 + hash(k * 5) * 26;
    for (let rr = r0; rr < 130; rr += 1.5) px(90 + Math.cos(ang) * rr, 96 + Math.sin(ang) * rr, 1, 1, 'rgba(236,235,238,' + (a * .85) + ')'); }
}

function objeto(o, t, p, tc, fotoClave) {
  if (!o || p <= 0) return;
  const cx = 90, cy = 96;
  ctx.save(); ctx.beginPath(); ctx.rect(0, cy - 62, W, 124 * p); ctx.clip();
  if (o.tipo !== 'espejo') {
    ctx.fillStyle = 'rgba(14,13,15,.9)'; ctx.fillRect(cx - 66, cy - 44, 132, 88);
    for (let i = 0; i < 132; i += 2) { px(cx - 66 + i, cy - 44, 1, 1, C.filete); px(cx - 66 + i, cy + 43, 1, 1, C.filete); }
  }
  switch (o.tipo) {
    case 'espejo': {
      // Espejo mágico ojival: van pasando portadas de anime
      const fw = 70, fh = 92, x0 = cx - fw / 2, y0 = cy - fh / 2 - 2, r = .75 * fw, rise = Math.sqrt(r * r - (r - fw / 2) ** 2);
      const borde = y => y < rise ? r - Math.sqrt(Math.max(0, r * r - (rise - y) ** 2)) : 0;
      ctx.save(); ctx.beginPath();
      for (let y = 0; y < fh; y++) ctx.rect(x0 + borde(y), y0 + y, fw - 2 * borde(y), 1);
      ctx.clip();
      const lista = (o.fotos || []).filter(k => IMGS[k]);
      const paso = .5, k = lista.length ? lista[Math.floor(Math.max(0, tc) / paso) % lista.length] : null;
      if (k) foto(k, x0, y0, fw, fh); else px(x0, y0, fw, fh, C.alto);
      if ((Math.max(0, tc) % paso) < .07) { ctx.fillStyle = 'rgba(236,235,238,.75)'; ctx.fillRect(x0, y0, fw, fh); }
      ctx.restore();
      for (let y = 0; y < fh; y++) { const xx = borde(y); px(x0 + xx - 2, y0 + y, 2, 1, C.plata); px(x0 + fw - xx, y0 + y, 2, 1, C.plata); }
      px(x0 - 3, y0 + fh, fw + 6, 3, C.plata); px(cx - 2, y0 - 3, 4, 3, C.vivo);
      break;
    }
    case 'calendario':
      for (let i = 0; i < 4; i++) { const x = cx - 66 + i * 34; px(x, cy - 30, 30, 44, C.plata); px(x + 1, cy - 29, 28, 42, C.noche); px(x + 1, cy - 29, 28, 8, C.filete);
        if ((o.marca === i || o.marca === 'todas') && tc > .35 + i * .08) px(x + 3, cy - 18, 24, 29, C.vino); }
      break;
    case 'tira': {
      const n = o.episodios ?? 12, cols = Math.min(n, 6);
      px(cx - 62, cy - 24, 124, 50, C.plata); px(cx - 61, cy - 23, 122, 48, C.negro);
      for (let k = 0; k < 30; k++) { px(cx - 60 + k * 4, cy - 22, 2, 2, C.filete); px(cx - 60 + k * 4, cy + 22, 2, 2, C.filete); }
      for (let i = 0; i < n; i++) { if (tc - .3 - i * .06 < 0) continue;
        const x = cx - 58 + (i % cols) * 20, y = cy - 18 + Math.floor(i / cols) * 22, corte = o.corte != null && i >= o.corte;
        px(x, y, 16, 16, corte ? C.vivo : C.plata); px(x + 1, y + 1, 14, 14, corte ? C.vino : C.alto); }
      break;
    }
    case 'tele': {
      px(cx - 34, cy - 34, 1, 8, C.plata); px(cx + 10, cy - 34, 1, 8, C.plata);
      px(cx - 46, cy - 27, 92, 62, C.plata); px(cx - 45, cy - 26, 90, 60, C.alto); px(cx - 41, cy - 22, 68, 52, C.negro);
      if (fotoClave) foto(fotoClave, cx - 40, cy - 21, 66, 50);
      for (let y = 0; y < 50; y += 2) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(cx - 40, cy - 21 + y, 66, 1); }
      if (o.pantalla) { ctx.fillStyle = 'rgba(14,13,15,.85)'; ctx.fillRect(cx - 40, cy + 15, 66, 13); }
      px(cx + 32, cy - 12, 6, 6, C.filete); px(cx + 33, cy + 2, 4, 4, C.filete);
      break;
    }
    case 'tijeras': {
      const sep = clamp((tc - 1.1) / .3) * 4;
      px(cx - 64 - sep, cy - 14, 60, 24, C.plata); px(cx - 63 - sep, cy - 13, 58, 22, C.alto);
      px(cx + 4 + sep, cy - 14, 60, 24, C.plata); px(cx + 5 + sep, cy - 13, 58, 22, C.alto);
      for (let y = cy - 30; y < cy + 32; y += 4) px(cx - 1, y, 2, 2, C.vivo);
      const ty = cy - 34 + clamp((tc - .3) / .8) * 58;
      px(cx - 5, ty - 3, 4, 4, C.plata); px(cx + 2, ty - 3, 4, 4, C.plata); px(cx - 1, ty + 1, 2, 7, C.luna); px(cx - 2, ty + 2, 1, 6, C.luna); px(cx + 1, ty + 2, 1, 6, C.luna);
      break;
    }
    case 'reloj': {
      px(cx - 16, cy - 32, 32, 3, C.plata); px(cx - 16, cy + 29, 32, 3, C.plata);
      for (let y = 0; y < 58; y++) { const w = Math.round(2 + Math.abs(y - 29) * .9); px(cx - w - 1, cy - 29 + y, 1, 1, C.plata); px(cx + w, cy - 29 + y, 1, 1, C.plata); }
      const fl = clamp((tc - .3) / 4);
      for (let y = 0; y < 26; y++) { const w = Math.round(Math.abs(y - 29) * .9); if (y > 26 * fl) px(cx - w + 1, cy - 29 + y + 2, 2 * w - 1, 1, C.vino); }
      for (let y = 0; y < 26 * fl; y++) { const w = Math.round((26 - y) * .9); px(cx - w, cy + 27 - y, 2 * w, 1, C.vino); }
      break;
    }
    case 'estudio': {
      for (let y = 0; y < 18; y++) px(cx - y * 2.4, cy - 34 + y, y * 4.8, 1, C.alto);
      px(cx - 44, cy - 16, 88, 50, C.alto); px(cx - 44, cy - 16, 88, 1, C.plata); px(cx - 26, cy - 24, 52, 12, C.vino);
      for (let r2 = 0; r2 < 2; r2++) for (let c = 0; c < 4; c++) px(cx - 36 + c * 20, cy - 6 + r2 * 18, 12, 10, Math.sin(t * 3 + c + r2) > .6 ? C.luna : C.plata);
      break;
    }
  }
  ctx.restore();
}

function conjuro(tc) {
  if (tc < 0 || tc > 1) return;
  const cx = 90, cy = 96, r = 10 + tc * 80, a = clamp(1 - tc);
  for (let k = 0; k < 64; k++) { const ang = k / 64 * Math.PI * 2 + tc * 3; px(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r * .6, 1, 1, 'rgba(201,199,203,' + a + ')'); }
  for (let k = 0; k < 28; k++) { const ang = hash(k) * Math.PI * 2, d = tc * (40 + hash(k * 7) * 70);
    const x = cx + Math.cos(ang) * d, y = cy + Math.sin(ang) * d * .8, c = k % 3 ? C.plata : C.vivo;
    px(x, y, 1, 1, c); if (k % 4 === 0) { px(x - 1, y, 3, 1, c); px(x, y - 1, 1, 3, c); } }
}

// Cortes que varían: iris, barrido en diagonal vino y flash.
function corte(t) {
  ictx.clearRect(0, 0, W, H);
  DATOS.cortes.forEach((c, k) => {
    const d = t - c; if (d < -.22 || d > .26) return;
    const tipo = k % 3;
    if (tipo === 0) {
      const r = d < 0 ? 220 * (-d / .22) : 220 * (d / .26); ictx.fillStyle = '#000';
      for (let y = 0; y < H; y++) { const dy = y - 140, dx = r * r - dy * dy;
        if (dx <= 0) ictx.fillRect(0, y, W, 1); else { const w = Math.sqrt(dx); ictx.fillRect(0, y, Math.max(0, 90 - w), 1); ictx.fillRect(90 + w, y, W, 1); } }
    } else if (tipo === 1) {
      const p = (d + .22) / .48;
      ictx.fillStyle = '#6b1528';
      for (let k2 = -8; k2 < 16; k2++) { const x0 = -260 + p * 620 + k2 * 22; ictx.beginPath(); ictx.moveTo(x0, 0); ictx.lineTo(x0 + 14, 0); ictx.lineTo(x0 + 14 - 140, H); ictx.lineTo(x0 - 140, H); ictx.fill(); }
      if (Math.abs(d) < .08) { ictx.fillStyle = '#0b0a0d'; ictx.fillRect(0, 0, W, H); }
    } else {
      ictx.fillStyle = 'rgba(236,235,238,' + clamp(1 - Math.abs(d) / .18) + ')'; ictx.fillRect(0, 0, W, H);
    }
  });
}

function bocaAbierta(voz, tReal) {
  if (!voz) return false;
  const k = Math.floor((tReal - voz.t) * 12);
  return k >= 0 && k < voz.env.length && voz.env[k] > .22;
}

window.render = tReal => {
  const t = Math.floor(tReal * 12 + 1e-6) / 12;
  const parte = DATOS.partes.find(p => tReal >= p.t0 && tReal < p.t1) || DATOS.partes[DATOS.partes.length - 1];
  document.querySelectorAll('.esc').forEach(e => { e.style.display = (tReal >= +e.dataset.in && tReal < +e.dataset.out) ? 'block' : 'none'; });
  const tc = parte.conjuro != null ? t - parte.conjuro : -1;
  cuarto(t, parte.tipo === 'cierre' ? 1 : clamp(tc / .2));
  if (parte.tipo !== 'cierre') { impacto(tc); conjuro(tc); objeto(parte.objeto, t, clamp(tc / .2), tc, parte.foto); }
  const habla = bocaAbierta(parte.voz, tReal);
  (parte.brujas || [{ id: 'vidente', poses: ['varita'] }]).forEach((b, k) => {
    const poses = b.poses?.length ? b.poses : ['parado'];
    const frac = clamp((t - parte.t0) / (parte.t1 - parte.t0));
    const pose = poses[Math.min(poses.length - 1, Math.floor(frac * poses.length))];
    bruja(b.id, k === 0 ? 30 : 150, 207, pose, t + k * .4, k === 1, k === 0 && habla);
  });
  // Cámara: zoom de golpe al revelar y temblor corto
  const golpe = tc >= 0 && tc < .6 ? Math.exp(-tc * 8) : 0;
  const tiembla = golpe > .25 ? (hash(t * 50) - .5) * 16 * golpe : 0;
  document.getElementById('camara').style.transform = 'translate(' + tiembla.toFixed(1) + 'px,0) scale(' + (1 + .08 * golpe).toFixed(4) + ')';
  // Textos: entran de golpe, con rebote
  document.querySelectorAll('[data-golpe]').forEach(el => { const a = clamp((t - (+el.dataset.golpe)) / .17), s = .6 + .4 * outBack(a);
    el.style.opacity = a;
    const base = el.classList.contains('etq') ? 'translate(-50%,-50%) ' : el.classList.contains('sticker') ? 'translateX(-50%) rotate(' + (-3 + Math.sin(t * 4) * 1.5).toFixed(2) + 'deg) ' : '';
    el.style.transform = base + 'scale(' + s.toFixed(3) + ')'; });
  document.querySelectorAll('[data-ono]').forEach(el => { const x = t - (+el.dataset.ono), a = x < 0 ? 0 : x < .08 ? x / .08 : x < .6 ? 1 : clamp(1 - (x - .6) / .2);
    el.style.opacity = a; el.style.scale = String(1 + .7 * Math.exp(-Math.max(0, x) * 14)); });
  // Subtítulos palabra por palabra
  document.querySelectorAll('.subs .chunk').forEach(ch => {
    const on = tReal >= +ch.dataset.t0 && tReal < +ch.dataset.t1;
    ch.style.opacity = on ? 1 : 0;
    if (!on) return;
    const a = clamp((tReal - +ch.dataset.t0) / .1); ch.style.transform = 'translateY(-50%) scale(' + (.8 + .2 * outBack(a)).toFixed(3) + ')';
    const ps = [...ch.querySelectorAll('.p')];
    let actual = -1; ps.forEach((p, i) => { if (tReal >= +p.dataset.t) actual = i; });
    ps.forEach((p, i) => { p.className = 'p' + (i === actual ? ' ahora' : ''); });
  });
  document.querySelectorAll('[data-anim="stamp"]').forEach(s => { const x = tReal - s.dataset.t, p = clamp(x / .32);
    s.style.opacity = clamp(p * 4); s.style.transform = 'scale(' + (x < .32 ? 1.9 - .9 * (1 - Math.pow(2, -10 * p)) : 1) + ') rotate(' + (x < .32 ? -8 * (1 - p) : 0) + 'deg)'; });
  corte(tReal);
};
`;
