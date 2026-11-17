// Plantilla de reel «grimorio» de @caba.kami: las brujitas del Aquelarre explican un concepto.
// Es la plantilla de los reels explicativos, distinta a propósito de la de lista:
//   · pixel art (escena de 180×320 «píxeles» ampliada a 1080×1920), como un juego de los 90
//   · la Vidente narra con voz en off; su boca se mueve con la voz y el texto sale en una caja
//     de diálogo al ritmo de lo que dice
//   · cada idea se conjura con la varita: círculo mágico, chispas y el objeto que aparece
//   · cortes con cierre de iris (no fallo de VHS), vals de bruja en lugar de lofi
//
// buildReelGrimorio(spec, imgs, bpm, voces) → { html, eventos, cortes, duracion, colocacion }
//   voces: { intro: {dur, env}, escenas: [{dur, env}], cierre: {dur, env} } (env: volumen a 12 fps)
//   colocacion: [{clave, t}] dónde suena cada clip de voz.

import { FONTS, CSS, enfasis } from '../carrusel/plantilla.js';
import { sello } from './plantilla.js';

const ESCALA = 6;               // 180×320 → 1080×1920
const W = 180, H = 320;

const G_CSS = `
body{margin:0;background:#000;}
.reel{width:1080px;height:1920px;position:relative;overflow:hidden;background:#0b0a0d;color:var(--luna);}
canvas.px{position:absolute;left:0;top:0;width:1080px;height:1920px;image-rendering:pixelated;}
.capa{position:absolute;inset:0;}
.esc{position:absolute;inset:0;display:none;}
.cab{position:absolute;left:60px;right:60px;top:132px;text-align:center;}
.cab .num{font-family:var(--dato);font-size:28px;letter-spacing:.1em;color:var(--plata);}
.cab h2{margin:14px 0 0;font-family:var(--display);font-weight:400;font-size:74px;line-height:1;color:var(--luna);}
.cab h2 em{font-style:italic;color:var(--plata);}
.etq{position:absolute;transform:translate(-50%,-50%);font-family:var(--dato);color:var(--luna);white-space:nowrap;text-align:center;letter-spacing:.04em;opacity:0;}
.dato{position:absolute;left:120px;right:120px;top:1290px;height:96px;display:flex;align-items:center;justify-content:center;white-space:nowrap;font-family:var(--display);font-size:66px;line-height:1;color:var(--noche);opacity:0;}
.dato em{font-style:italic;color:var(--vino);}
.dialogo{position:absolute;left:48px;width:864px;top:1452px;height:324px;}
.dialogo .nombre{position:absolute;left:36px;top:-30px;background:var(--vino);color:var(--luna);font-family:var(--dato);font-size:28px;letter-spacing:.12em;padding:8px 18px 6px;border:6px solid var(--plata);}
.dialogo .txt{position:absolute;left:48px;right:48px;top:52px;font-family:var(--dato);font-size:40px;line-height:1.42;color:var(--luna);}
.dialogo .flecha{position:absolute;right:40px;bottom:26px;width:0;height:0;border-left:16px solid transparent;border-right:16px solid transparent;border-top:20px solid var(--plata);opacity:0;}
.titulo{position:absolute;left:60px;right:60px;text-align:center;}
.titulo .sup{font-family:var(--dato);font-size:30px;letter-spacing:.12em;color:var(--plata);}
.titulo h1{margin:22px 0 0;font-family:var(--display);font-weight:400;font-size:124px;line-height:.92;}
.titulo h1 em{font-style:italic;color:var(--plata);}
.titulo .bajada{margin-top:26px;font-family:var(--display);font-style:italic;font-size:54px;line-height:1.1;color:var(--plata);text-wrap:balance;}
`;

// Duración de una parte: la voz más un respiro, redondeada al pulso de la música.
const aPulsos = (seg, b, min) => Math.max(min, Math.ceil(seg / b)) * b;

export function buildReelGrimorio(spec, imgs = {}, bpm = 96, voces = {}) {
  const b = 60 / bpm;
  const ENTRADA = .75;                       // la voz entra cuando el iris ya se abrió
  const partes = [];
  const colocacion = [];
  const cortes = [];
  const eventos = [];
  let t = 0;

  // INTRO
  const vi = voces.intro;
  const dIntro = aPulsos((vi?.dur ?? 3.2) + 1.6, b, 6);
  partes.push({ tipo: 'intro', t0: 0, t1: dIntro, voz: vi ? { t: 1.0, ...vi, texto: spec.intro?.voz ?? '' } : null });
  if (vi) colocacion.push({ clave: 'intro', t: 1.0 });
  eventos.push({ tipo: 'cerilla', t: .15 }, { tipo: 'campana', t: 1.1, vol: .7 });
  t = dIntro; cortes.push(t);

  // ESCENAS
  spec.escenas.forEach((e, i) => {
    const v = voces.escenas?.[i];
    const d = aPulsos(ENTRADA + (v?.dur ?? 4) + .9, b, 6);
    const conjuro = t + .45;
    partes.push({ tipo: 'escena', i, t0: t, t1: t + d, conjuro, voz: v ? { t: t + ENTRADA, ...v, texto: e.voz } : null, e });
    if (v) colocacion.push({ clave: `escena-${i}`, t: t + ENTRADA });
    eventos.push({ tipo: 'pagina', t: t - .05 }, { tipo: 'campana', t: conjuro + .1 }, { tipo: 'brillo', t: conjuro + .2, vol: .8 });
    t += d; cortes.push(t);
  });

  // CIERRE
  const vc = voces.cierre;
  const dCierre = aPulsos((vc?.dur ?? 2.5) + 2.6, b, 6);
  const golpe = t + Math.max(2 * b, (vc?.dur ?? 2) + 1.1);
  partes.push({ tipo: 'cierre', t0: t, t1: t + dCierre, voz: vc ? { t: t + .6, ...vc, texto: spec.cierre?.voz ?? '' } : null, golpe });
  if (vc) colocacion.push({ clave: 'cierre', t: t + .6 });
  eventos.push({ tipo: 'pagina', t: t - .05 }, { tipo: 'sello', t: golpe });
  const duracion = t + dCierre;

  // ── HTML de cada parte (texto nítido sobre el lienzo pixelado) ──
  const htmlPartes = partes.map((p, k) => {
    if (p.tipo === 'intro') return `<div class="esc" data-in="${p.t0}" data-out="${p.t1}">
      <div class="titulo" style="top:330px" data-fade="${.6}">
        <div class="sup">${spec.etiqueta ?? 'EL GRIMORIO DEL AQUELARRE'}</div>
        <h1>${(spec.titulo ?? []).map(enfasis).join('<br>')}</h1>
        <div class="bajada">${spec.subtitulo ?? ''}</div>
      </div>
      ${p.voz ? dialogo(p.voz, spec.narradora ?? 'VIDENTE') : ''}
    </div>`;
    if (p.tipo === 'cierre') return `<div class="esc" data-in="${p.t0}" data-out="${p.t1 + 1}">
      <div class="titulo" style="top:520px" data-fade="${p.t0 + .4}">
        <h1 style="font-size:104px">${spec.cierre.pregunta.map(enfasis).join('<br>')}</h1>
        <div class="sup" style="margin-top:40px">${spec.cierre.cta ?? ''}</div>
      </div>
      <div style="position:absolute;left:0;right:0;top:1060px;display:flex;justify-content:center;align-items:center;gap:30px">
        <div data-fade="${p.t0 + 1.2}" style="font-family:var(--display);font-style:italic;font-size:84px;opacity:0">caba<span style="color:var(--vino-vivo)">.</span>kami</div>
        ${sello(p.golpe - .32)}
      </div>
      ${p.voz ? dialogo(p.voz, spec.narradora ?? 'VIDENTE') : ''}
    </div>`;
    const e = p.e;
    const etqs = etiquetasObjeto(e.objeto).map(x =>
      `<div class="etq" data-fade="${p.conjuro + .55 + (x.retraso ?? 0)}" style="left:${x.x * ESCALA}px;top:${x.y * ESCALA}px;font-size:${x.size ?? 24}px${x.color ? `;color:${x.color}` : ''}">${x.texto}</div>`).join('');
    return `<div class="esc" data-in="${p.t0}" data-out="${p.t1}">
      <div class="cab"><div class="num">LECCIÓN ${String(p.i + 1).padStart(2, '0')} · ${spec.tema ?? ''}</div><h2>${enfasis(e.titulo ?? '')}</h2></div>
      ${etqs}
      ${e.dato ? `<div class="dato" data-fade="${p.conjuro + 1.2}"><span>${enfasis(e.dato)}</span></div>` : ''}
      ${p.voz ? dialogo(p.voz, spec.narradora ?? 'VIDENTE') : ''}
    </div>`;
  }).join('\n');

  const datos = {
    partes: partes.map(p => ({ tipo: p.tipo, t0: p.t0, t1: p.t1, conjuro: p.conjuro, golpe: p.golpe, voz: p.voz ? { t: p.voz.t, dur: p.voz.dur, env: p.voz.env } : null,
      objeto: p.e?.objeto ?? null, brujas: p.e?.brujas ?? null, foto: p.e?.foto ?? null })),
    cortes,
  };
  const fotos = Object.fromEntries(Object.entries(imgs).filter(([, v]) => v));

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
${FONTS.map(f => `<link rel="stylesheet" href="${f}">`).join('\n')}
<style>${CSS}${G_CSS}</style></head><body>
<div class="reel">
  <canvas class="px" id="lienzo" width="${W}" height="${H}"></canvas>
  <div class="capa" id="capa">${htmlPartes}</div>
  <canvas class="px" id="iris" width="${W}" height="${H}"></canvas>
</div>
<script>
const DATOS = ${JSON.stringify(datos)};
const FOTOS = ${JSON.stringify(fotos)};
${MOTOR}
</script></body></html>`;
  return { html, eventos, cortes, duracion, colocacion };
}

// Caja de diálogo: el texto aparece al ritmo de la voz.
function dialogo(voz, nombre) {
  return `<div class="dialogo" data-dialogo='${JSON.stringify({ t: voz.t, dur: voz.dur })}'>
    <div class="nombre">${nombre}</div>
    <div class="txt" data-texto="${String(voz.texto).replace(/"/g, '&quot;')}"></div>
    <div class="flecha"></div>
  </div>`;
}

// Rótulos de texto de cada objeto, en coordenadas de la escena pixelada.
function etiquetasObjeto(o) {
  if (!o) return [];
  const cx = 90, cy = 98;
  switch (o.tipo) {
    case 'calendario': return (o.etiquetas ?? ['ENE–MAR', 'ABR–JUN', 'JUL–SEP', 'OCT–DIC']).map((n, i) => ({ texto: n, x: cx - 54 + i * 36, y: cy - 22, size: 22, retraso: i * .12 }))
      .concat([0, 1, 2, 3].map(i => ({ texto: String(i + 1), x: cx - 54 + i * 36, y: cy + 4, size: 64, retraso: .3 + i * .12 })));
    case 'tira': { const n = o.episodios ?? 12, cols = Math.min(n, 6);
      return Array.from({ length: n }, (_, i) => ({ texto: String(i + 1), x: cx - 50 + (i % cols) * 20, y: cy - 10 + Math.floor(i / cols) * 22, size: 34, retraso: i * .1 })); }
    case 'tijeras': return [{ texto: o.izquierda ?? 'PARTE 1', x: cx - 32, y: cy, size: 26 }, { texto: o.derecha ?? 'PARTE 2', x: cx + 32, y: cy, size: 26 },
      ...(o.pausa ? [{ texto: o.pausa, x: cx, y: cy + 33, size: 26, color: 'var(--vino-vivo);background:#0e0d0f;padding:4px 12px', retraso: .6 }] : [])];
    case 'tele': return o.pantalla ? [{ texto: o.pantalla, x: cx - 4, y: cy + 22, size: 24, retraso: .4 }] : [];
    case 'reloj': return o.texto ? [{ texto: o.texto, x: cx, y: cy + 36, size: 30, retraso: .4 }] : [];
    case 'estudio': return [{ texto: o.letrero ?? 'ESTUDIO', x: cx, y: cy - 16, size: 26 }];
    default: return [];
  }
}

// ── Motor (lado navegador): pinta la escena pixelada en cada fotograma ─────────
const MOTOR = String.raw`
const W = 180, H = 320;
const C = { noche:"#0e0d0f", humo:"#201e21", alto:"#2e2b2f", vino:"#6b1528", vivo:"#b8304d", plata:"#c9c7cb", luna:"#ecebee", niebla:"#8c8a90", filete:"#3d3a3f",
  muro:"#17151a", muro2:"#1c1a20", suelo:"#111013", piel:"#e8dcd6", negro:"#08070a", sombrero:"#2a2530", sombrero2:"#463f4c", pergamino:"#d9cdb8", pergamino2:"#b8a98e" };
const cv = document.getElementById('lienzo'), ctx = cv.getContext('2d');
const iv = document.getElementById('iris'), ictx = iv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w || 1, h || 1); };
const hash = n => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
const clamp = x => x < 0 ? 0 : x > 1 ? 1 : x;
const outBack = x => { const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

// Fotos para la tele: se reducen al tamaño de la pantalla pixelada.
const IMGS = {};
Object.entries(FOTOS).forEach(([k, src]) => { const im = new Image(); im.src = src; IMGS[k] = im; });

// ── Brujas ──
const BRUJAS = {
  vidente:   { tunica: C.vino,    pelo: C.plata,  objeto: 'bola' },
  escriba:   { tunica: C.alto,    pelo: '#2a2226', objeto: 'pluma' },
  guardiana: { tunica: '#2a2430', pelo: C.luna,   objeto: 'farol' },
  cronista:  { tunica: '#3d0f1b', pelo: C.niebla, objeto: 'libro' },
  mensajera: { tunica: '#1b181e', pelo: C.vivo,   objeto: 'carta' },
};

function bruja(id, x, y, pose, t, espejo, boca) {
  const B = BRUJAS[id] || BRUJAS.vidente;
  const s = 2, salto = pose === 'celebra' ? -Math.abs(Math.sin(t * 7)) * 6 : (pose === 'sorpresa' ? -2 : 0);
  const bob = Math.floor(t * 2) % 2;
  const ox = x - 7 * s, oy = y - 26 * s + bob + salto;
  const q = (a, r, w, h, c) => { const xx = espejo ? 14 - a - (w || 1) : a; px(ox + xx * s, oy + r * s, (w || 1) * s, (h || 1) * s, c); };
  px(x - 12, y + 1, 24, 2, 'rgba(0,0,0,.55)');
  // Sombrero de bruja: punta doblada, banda plata, ala ancha
  q(espejo ? 5 : 9, 0, 1, 1, C.sombrero); q(8, 1, 2, 1, C.sombrero);
  [[7, 8], [6, 8], [6, 9], [5, 9], [5, 10]].forEach(([a, b2], r) => { q(a, r + 2, b2 - a + 1, 1, C.sombrero); q(a, r + 2, 1, 1, C.sombrero2); });
  q(4, 6, 7, 1, C.plata); q(0, 7, 15, 1, C.sombrero); q(1, 8, 13, 1, C.sombrero2);
  // Pelo y cara
  q(3, 8, 9, 1, B.pelo);
  for (let r = 9; r <= 13; r++) { q(3, r, 2, 1, B.pelo); q(10, r, 2, 1, B.pelo); q(5, r, 5, 1, C.piel); }
  q(3, 14, 2, 2, B.pelo); q(10, 14, 2, 2, B.pelo);
  const parpadeo = (t * 1.2 + x) % 3.6 < .1;
  const ojo = parpadeo ? C.niebla : C.negro;
  q(6, 10, 1, 1, ojo); q(8, 10, 1, 1, ojo);
  q(5, 11, 1, 1, '#d9a6ae'); q(9, 11, 1, 1, '#d9a6ae');
  if (pose === 'llora') { const ph = (t * 2) % 1; q(5, 11 + Math.floor(ph * 3), 1, 1, C.plata); q(9, 11 + Math.floor(((t * 2) + .5) % 1 * 3), 1, 1, C.plata); }
  // Boca: abierta mientras habla o en sorpresa
  if (boca || pose === 'sorpresa') { q(6, 12, 3, 1, C.negro); q(7, 13, 1, 1, '#8a2a3a'); }
  else if (pose === 'llora' || pose === 'triste') { q(6, 13, 3, 1, '#8a2a3a'); q(6, 12, 1, 1, C.piel); }
  else q(7, 12, 2, 1, '#8a2a3a');
  // Túnica con cuello plata y ribete
  q(4, 15, 7, 1, B.tunica); q(6, 15, 3, 1, C.plata);
  for (let r = 16; r <= 23; r++) { const e = Math.floor((r - 16) / 3); q(4 - e, r, 7 + 2 * e, 1, B.tunica); }
  for (let a = 2; a < 13; a += 2) q(a, 23, 1, 1, C.plata);
  const paso = pose === 'camina' ? Math.floor(t * 6) % 2 : 0;
  q(5, 24 - paso, 2, 2, C.negro); q(8, 24 - (1 - paso) * (pose === 'camina' ? 1 : 0), 2, 2, C.negro);
  // Brazos según la pose (mano derecha = la del lado del caldero cuando no está en espejo)
  const manga = (pts, mano) => { pts.forEach(([a, r]) => q(a, r, 2, 2, B.tunica)); q(mano[0], mano[1], 1, 1, C.piel); return mano; };
  let dcha, izq;
  switch (pose) {
    case 'varita': dcha = manga([[11, 15], [12, 13], [13, 11]], [14, 10]);
      q(14, 6, 1, 4, C.luna); { const ch = Math.floor(t * 8) % 2; q(14 - ch, 4 + ch, 1, 1, C.plata); q(15, 5 - ch, 1, 1, C.luna); } izq = manga([[2, 16], [2, 18]], [2, 20]); break;
    case 'senala': dcha = manga([[11, 16], [13, 15], [15, 14]], [17, 14]); izq = manga([[2, 16], [2, 18]], [2, 20]); break;
    case 'sorpresa': case 'celebra': dcha = manga([[11, 15], [12, 13], [13, 11]], [14, 10]); izq = manga([[2, 15], [1, 13], [0, 11]], [0, 10]); break;
    case 'pensar': dcha = manga([[11, 16], [11, 14]], [10, 13]); izq = manga([[2, 16], [3, 18]], [5, 19]); break;
    case 'llora': dcha = manga([[11, 15], [10, 13]], [9, 12]); izq = manga([[2, 15], [3, 13]], [5, 12]); break;
    case 'encoge': dcha = manga([[11, 15], [13, 14]], [15, 13]); izq = manga([[2, 15], [0, 14]], [-1, 13]); break;
    default: dcha = manga([[11, 16], [11, 18]], [12, 20]); izq = manga([[2, 16], [2, 18]], [2, 20]);
  }
  // Objeto propio en la mano libre
  const [ha, hr] = izq;
  if (B.objeto === 'bola') { const g = Math.sin(t * 3) > 0; q(ha - 2, hr, 3, 3, C.plata); q(ha - 1, hr + 1, 1, 1, g ? C.luna : C.vivo); }
  if (B.objeto === 'pluma') { q(ha - 1, hr - 4, 1, 5, C.luna); }
  if (B.objeto === 'farol') { q(ha - 2, hr, 3, 4, Math.floor(t * 3) % 2 ? C.plata : C.luna); q(ha - 2, hr - 1, 3, 1, C.filete); }
  if (B.objeto === 'libro') { q(ha - 3, hr, 4, 4, C.vino); q(ha - 3, hr, 1, 4, C.plata); }
  if (B.objeto === 'carta') { q(ha - 3, hr, 4, 3, C.luna); q(ha - 2, hr + 1, 1, 1, C.vivo); q(11, 10, 3, 2, C.negro); q(13, 10, 1, 1, C.niebla); }
}

// ── Escenario ──
const ESTRELLAS = Array.from({ length: 40 }, (_, i) => ({ x: (i * 47) % 180, y: 4 + (i * 29) % 130, f: i * .9 }));
function cuarto(t, atenuar) {
  px(0, 0, W, H, '#0b0a0d');
  // Muro y suelo del escenario (de y=50 a y=206)
  px(0, 50, W, 130, C.muro);
  for (let y = 54; y < 180; y += 8) for (let x = (y / 8) % 2 ? 0 : 8; x < W; x += 16) { px(x, y, 1, 7, C.muro2); px(x, y + 7, 15, 1, C.muro2); }
  px(0, 180, W, 26, C.suelo);
  for (let y = 180; y < 206; y += 9) px(0, y, W, 1, '#19171c');
  // Ventana ojival con luna y estrellas
  const vx = 62, vw = 56, vy = 58, vh = 84, r = .75 * vw, rise = Math.sqrt(r * r - (r - vw / 2) ** 2);
  for (let y = 0; y < vh; y++) {
    const x0 = y < rise ? r - Math.sqrt(Math.max(0, r * r - (rise - y) ** 2)) : 0;
    px(vx + x0, vy + y, vw - 2 * x0, 1, '#0a0910'); px(vx + x0 - 1, vy + y, 1, 1, C.plata); px(vx + vw - x0, vy + y, 1, 1, C.plata);
  }
  ESTRELLAS.forEach(s => { if (s.x > vx + 3 && s.x < vx + vw - 3 && s.y > vy + 12 && s.y < vy + vh) { const b = .5 + .5 * Math.sin(t * 2 + s.f); if (b > .4) px(s.x, s.y, 1, 1, b > .8 ? C.luna : C.niebla); } });
  for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if (x * x + y * y <= 36 && (x - 3) ** 2 + (y + 1) ** 2 > 24) px(98 + x, 78 + y, 1, 1, C.luna);
  px(vx, vy + 56, vw, 1, C.plata); px(vx + vw / 2, vy + 20, 1, vh - 20, C.plata);
  px(vx - 4, vy + vh, vw + 8, 2, C.alto);
  // Velas simétricas
  [20, 160].forEach((x, i) => { px(x - 3, 108, 7, 2, C.filete); px(x - 1, 98, 3, 10, C.luna); const f = Math.sin(t * 9 + i) > 0 ? 1 : 0; px(x - f, 93, 2, 4, C.vivo); px(x, 92 - f, 1, 2, C.plata); });
  // Estantes con libros, simétricos
  [[6, 130], [150, 130]].forEach(([x0, y0]) => { px(x0, y0 + 14, 24, 2, C.alto); for (let k = 0; k < 6; k++) px(x0 + 1 + k * 4, y0 + (k % 2) * 2, 3, 14 - (k % 2) * 2, [C.vino, C.filete, C.niebla][k % 3]); });
  if (atenuar) { ctx.fillStyle = 'rgba(11,10,13,' + (.72 * atenuar) + ')'; ctx.fillRect(56, 54, 68, 92); }
  // Caldero en el centro
  const cx = 90, cy = 204;
  for (let i = 0; i < 7; i++) { const h = 2 + ((Math.sin(t * 10 + i * 1.7) + 1) * 1.6); px(cx - 10 + i * 3, cy - h + 1, 2, h, i % 2 ? C.vivo : C.vino); }
  for (let rr = 0; rr < 16; rr++) { const w = Math.round(28 - Math.pow(Math.abs(rr - 6) / 8, 2) * 12); px(cx - w / 2, cy - 18 + rr, w, 1, rr < 2 ? '#1d1b20' : '#141216'); }
  px(cx - 15, cy - 20, 30, 2, C.filete); px(cx - 14, cy - 21, 28, 1, C.plata); px(cx - 12, cy - 23, 24, 2, C.vino); px(cx - 10, cy - 24, 20, 1, C.vivo);
  for (let i = 0; i < 6; i++) { const ph = (t * .8 + i * .37) % 1; px(cx - 8 + ((i * 7) % 17) + Math.sin(ph * 9) * 2, cy - 24 - ph * 22, 1, 1, ph > .6 ? C.niebla : C.plata); }
  // Marco del escenario
  px(0, 48, W, 2, C.filete); px(0, 206, W, 2, C.filete);
}

// ── Objetos conjurados (aparecen de arriba abajo con p de 0 a 1) ──
function objeto(o, t, p, tc, foto) {
  if (!o || p <= 0) return;
  const cx = 90, cy = 98;
  ctx.save(); ctx.beginPath(); ctx.rect(0, cy - 60, W, 120 * p); ctx.clip();
  // Halo de humo mágico detrás
  ctx.fillStyle = 'rgba(14,13,15,.85)'; ctx.fillRect(cx - 66, cy - 44, 132, 88);
  for (let i = 0; i < 132; i += 2) { px(cx - 66 + i, cy - 44, 1, 1, C.filete); px(cx - 66 + i, cy + 43, 1, 1, C.filete); }
  switch (o.tipo) {
    case 'calendario':
      for (let i = 0; i < 4; i++) { const x = cx - 70 + i * 36; px(x, cy - 30, 32, 44, C.plata); px(x + 1, cy - 29, 30, 42, C.noche); px(x + 1, cy - 29, 30, 8, C.filete);
        if (o.marca === i || o.marca === 'todas') px(x + 3, cy - 18, 26, 29, C.vino); }
      break;
    case 'tira': {
      const n = o.episodios ?? 12, cols = Math.min(n, 6);
      px(cx - 62, cy - 24, 124, 50, C.plata); px(cx - 61, cy - 23, 122, 48, C.negro);
      for (let k = 0; k < 30; k++) { px(cx - 60 + k * 4, cy - 22, 2, 2, C.filete); px(cx - 60 + k * 4, cy + 22, 2, 2, C.filete); }
      for (let i = 0; i < n; i++) { const vis = tc - .55 - i * .1; if (vis < 0) continue;
        const x = cx - 58 + (i % cols) * 20, y = cy - 18 + Math.floor(i / cols) * 22; const corte = o.corte != null && i >= o.corte;
        px(x, y, 16, 16, corte ? C.vivo : C.plata); px(x + 1, y + 1, 14, 14, corte ? C.vino : C.alto); }
      break;
    }
    case 'tele': {
      px(cx - 34, cy - 34, 1, 8, C.plata); px(cx - 33, cy - 36, 1, 2, C.plata); px(cx + 10, cy - 34, 1, 8, C.plata); px(cx + 11, cy - 36, 1, 2, C.plata);
      px(cx - 44, cy - 26, 88, 60, C.plata); px(cx - 43, cy - 25, 86, 58, C.alto);
      px(cx - 39, cy - 21, 64, 50, C.negro);
      const im = foto && IMGS[foto];
      if (im && im.complete && im.naturalWidth) {
        // Recorte centrado de la portada, reducido a 62×48 «píxeles»: pixelado de verdad.
        const ar = 62 / 48, iw = im.naturalWidth, ih = im.naturalHeight, sw = Math.min(iw, ih * ar), sh = sw / ar;
        ctx.imageSmoothingEnabled = true; ctx.drawImage(im, (iw - sw) / 2, Math.max(0, (ih - sh) * .25), sw, sh, cx - 38, cy - 20, 62, 48); ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = 'rgba(107,21,40,.18)'; ctx.fillRect(cx - 38, cy - 20, 62, 48);
        for (let y = 0; y < 48; y += 2) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(cx - 38, cy - 20 + y, 62, 1); }
        ctx.fillStyle = 'rgba(14,13,15,.82)'; ctx.fillRect(cx - 38, cy + 15, 62, 13);
      } else { for (let k = 0; k < 160; k++) px(cx - 38 + hash(k + Math.floor(t * 12)) * 62, cy - 20 + hash(k * 3.1) * 48, 1, 1, C.niebla); }
      px(cx + 31, cy - 12, 6, 6, C.filete); px(cx + 32, cy + 2, 4, 4, C.filete);
      break;
    }
    case 'tijeras': {
      px(cx - 62, cy - 14, 58, 24, C.plata); px(cx - 61, cy - 13, 56, 22, C.alto);
      px(cx + 4, cy - 14, 58, 24, C.plata); px(cx + 5, cy - 13, 56, 22, C.alto);
      for (let y = cy - 30; y < cy + 32; y += 4) px(cx - 1, y, 2, 2, C.vivo);
      const ty = cy - 34 + clamp((tc - .5) / 1.2) * 58;
      px(cx - 5, ty - 3, 4, 4, C.plata); px(cx + 2, ty - 3, 4, 4, C.plata); px(cx - 1, ty + 1, 2, 7, C.luna); px(cx - 2, ty + 2, 1, 6, C.luna); px(cx + 1, ty + 2, 1, 6, C.luna);
      break;
    }
    case 'reloj': {
      px(cx - 16, cy - 32, 32, 3, C.plata); px(cx - 16, cy + 29, 32, 3, C.plata);
      for (let y = 0; y < 58; y++) { const w = Math.round(2 + Math.abs(y - 29) * .9); px(cx - w - 1, cy - 29 + y, 1, 1, C.plata); px(cx + w, cy - 29 + y, 1, 1, C.plata); }
      const fl = clamp((tc - .4) / 6);
      for (let y = 0; y < 26; y++) { const w = Math.round(Math.abs(y - 29) * .9); if (y > 26 * fl) px(cx - w + 1, cy - 29 + y + 2, 2 * w - 1, 1, C.vino); }
      for (let y = 0; y < 26 * fl; y++) { const w = Math.round((26 - y) * .9); px(cx - w, cy + 27 - y, 2 * w, 1, C.vino); }
      if (fl < 1) px(cx, cy - 1 + (Math.floor(t * 12) % 4) * 2, 1, 2, C.vivo);
      break;
    }
    case 'estudio': {
      for (let y = 0; y < 18; y++) px(cx - y * 2.4, cy - 34 + y, y * 4.8, 1, C.alto);
      px(cx - 44, cy - 16, 88, 50, C.alto); px(cx - 44, cy - 16, 88, 1, C.plata);
      px(cx - 26, cy - 24, 52, 12, C.vino);
      for (let r2 = 0; r2 < 2; r2++) for (let c = 0; c < 4; c++) px(cx - 36 + c * 20, cy - 6 + r2 * 18, 12, 10, Math.sin(t * 3 + c + r2) > .6 ? C.luna : C.plata);
      break;
    }
  }
  ctx.restore();
}

// Círculo mágico y chispas del conjuro
function conjuro(t, tc) {
  if (tc < 0 || tc > 1.6) return;
  const cx = 90, cy = 98, r = 10 + tc * 70, a = clamp(1 - tc / 1.6);
  for (let k = 0; k < 64; k++) { const ang = k / 64 * Math.PI * 2 + tc * 2; px(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r * .6, 1, 1, 'rgba(201,199,203,' + a + ')'); }
  for (let k = 0; k < 24; k++) { const ang = hash(k) * Math.PI * 2, d = tc * (30 + hash(k * 7) * 60);
    const x = cx + Math.cos(ang) * d, y = cy + Math.sin(ang) * d * .8; const c = k % 3 ? C.plata : C.vivo;
    px(x, y, 1, 1, c); if (k % 4 === 0) { px(x - 1, y, 3, 1, c); px(x, y - 1, 1, 3, c); } }
}

// Escena de la intro y del cierre: cielo, luna grande y una bruja en escoba que la cruza.
function cielo(t, volar, ly, lr) {
  ly = ly ?? 180; lr = lr ?? 26;
  px(0, 0, W, H, '#0b0a0d');
  ESTRELLAS.forEach((s, i) => { const b = .5 + .5 * Math.sin(t * 2 + s.f); if (b > .3) px(s.x, s.y + (i % 3) * 60, 1, 1, b > .8 ? C.luna : C.niebla); });
  for (let y = -lr; y <= lr; y++) for (let x = -lr; x <= lr; x++) if (x * x + y * y <= lr * lr) px(90 + x, ly + y, 1, 1, ((x * 3 + y * 5) & 7) === 0 ? '#d4d2d6' : C.luna);
  const k0 = lr / 26;
  [[-8, -6, 5], [6, 8, 4], [-12, 12, 3], [10, -12, 3]].forEach(([dx, dy, r]) => { r = Math.max(1, Math.round(r * k0)); for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) px(90 + dx * k0 + x, ly + dy * k0 + y, 1, 1, '#bdbbc0'); });
  if (volar) {
    const q = clamp((t - .3) / 3.2), x = -30 + q * 240, y = ly + 12 - Math.sin(q * Math.PI) * 26;
    px(x - 14, y + 6, 26, 2, '#5a3a2a'); for (let k = 0; k < 6; k++) px(x - 18 - k, y + 4 + (k % 3), 4, 1, '#8a6a4a');
    px(x - 4, y - 6, 8, 10, C.vino); px(x - 3, y - 12, 6, 6, C.piel); px(x - 6, y - 14, 12, 2, C.sombrero); px(x - 3, y - 20, 4, 6, C.sombrero); px(x - 1, y - 23, 2, 3, C.sombrero);
    px(x + 3, y - 12, 3, 8, C.plata);
    for (let k = 0; k < 8; k++) { const kk = (t * 10 + k) % 8; px(x - 22 - kk * 4, y + 5 + Math.sin(kk) * 2, 1, 1, kk < 4 ? C.plata : C.niebla); }
  }
}

// Pergamino del dato (de y=214 a y=232)
function pergamino(p) {
  if (p <= 0) return;
  const w = Math.round(148 * Math.min(1, p * 1.4)), x = 90 - w / 2;
  px(x, 213, w, 20, C.pergamino); px(x, 213, w, 1, C.pergamino2); px(x, 232, w, 1, C.pergamino2);
  px(x - 4, 211, 4, 24, C.pergamino2); px(x + w, 211, 4, 24, C.pergamino2);
}

// Marco de la caja de diálogo (de y=238 a y=292), a lo RPG.
function marcoDialogo() {
  px(8, 242, 144, 54, C.plata); px(9, 243, 142, 52, C.noche); px(10, 244, 140, 50, C.plata); px(11, 245, 138, 48, '#0f0d12');
}

// Iris: el corte entre partes se cierra y se abre como en un juego antiguo.
function iris(t) {
  ictx.clearRect(0, 0, W, H);
  let r = 999;
  DATOS.cortes.forEach(c => { const d = t - c; if (d > -.35 && d < 0) r = Math.min(r, 220 * (-d / .35)); if (d >= 0 && d < .4) r = Math.min(r, 220 * (d / .4)); });
  if (r > 260) return;
  ictx.fillStyle = '#000';
  for (let y = 0; y < H; y++) { const dy = y - 160; const dx = r * r - dy * dy;
    if (dx <= 0) ictx.fillRect(0, y, W, 1); else { const w = Math.sqrt(dx); ictx.fillRect(0, y, Math.max(0, 90 - w), 1); ictx.fillRect(90 + w, y, W, 1); } }
}

function bocaAbierta(voz, tReal) {
  if (!voz) return false;
  const k = Math.floor((tReal - voz.t) * 12);
  return k >= 0 && k < voz.env.length && voz.env[k] > .22;
}

window.render = tReal => {
  const t = Math.floor(tReal * 12 + 1e-6) / 12;   // de a dos
  const parte = DATOS.partes.find(p => tReal >= p.t0 && tReal < p.t1) || DATOS.partes[DATOS.partes.length - 1];
  document.querySelectorAll('.esc').forEach(e => { e.style.display = (tReal >= +e.dataset.in && tReal < +e.dataset.out) ? 'block' : 'none'; });
  // Lienzo
  if (parte.tipo === 'escena') {
    const tc = t - parte.conjuro;
    cuarto(t, clamp(tc / .4));
    conjuro(t, tc);
    objeto(parte.objeto, t, clamp((tc - .15) / .5), tc, parte.foto);
    // Brujas: la narradora a la izquierda; la segunda, a la derecha y mirando al centro.
    const habla = bocaAbierta(parte.voz, tReal);
    const br = parte.brujas || [{ id: 'vidente', poses: ['varita', 'senala'] }];
    br.forEach((b, k) => {
      const poses = b.poses?.length ? b.poses : ['parado'];
      const frac = clamp((t - parte.t0) / (parte.t1 - parte.t0));
      const pose = tc < .9 && k === 0 && poses[0] === 'varita' ? 'varita' : poses[Math.min(poses.length - 1, Math.floor(frac * poses.length))];
      bruja(b.id, k === 0 ? 34 : 146, 204, pose, t + k * .4, k === 1, k === 0 && habla);
    });
    pergamino(clamp((tc - 1.1) / .5));
    marcoDialogo();
  } else {
    if (parte.tipo === 'intro') cielo(t, true); else cielo(t, false, 44, 12);
    if (parte.voz) marcoDialogo();
  }
  // Texto HTML: fundidos, diálogo al ritmo de la voz, flecha que parpadea
  document.querySelectorAll('[data-fade]').forEach(el => { const a = clamp((t - (+el.dataset.fade)) / .3); el.style.opacity = a; el.style.transform = (el.classList.contains('etq') ? 'translate(-50%,-50%) ' : '') + 'translateY(' + ((1 - a) * 18) + 'px)'; });
  document.querySelectorAll('[data-dialogo]').forEach(el => {
    const d = JSON.parse(el.dataset.dialogo), txt = el.querySelector('.txt'), full = txt.dataset.texto;
    const q = clamp((tReal - d.t) / Math.max(.5, d.dur * .96));
    txt.textContent = full.slice(0, Math.round(full.length * q));
    el.querySelector('.flecha').style.opacity = q >= 1 && Math.floor(t * 3) % 2 ? 1 : 0;
  });
  // Sello del cierre
  document.querySelectorAll('[data-anim="stamp"]').forEach(s => { const x = tReal - s.dataset.t, p = clamp(x / .32);
    s.style.opacity = clamp(p * 4); s.style.transform = 'scale(' + (x < .32 ? 1.9 - .9 * (1 - Math.pow(2, -10 * p)) : 1) + ') rotate(' + (x < .32 ? -8 * (1 - p) : 0) + 'deg)'; });
  iris(tReal);
};
`;
