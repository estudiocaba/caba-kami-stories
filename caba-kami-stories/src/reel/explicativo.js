// Plantilla de reel «explicativo» de @caba.kami: monigotes que explican un concepto de anime.
// Vídeo vertical 1080×1920 a ritmo de la música: intro → escenas → cierre con sello.
//
// Cada escena: rótulo a máquina, un objeto dibujado a trazo plata (calendario, tira de episodios,
// tele, tijeras, reloj de arena o estudio), uno o dos monigotes que cambian de pose (de a dos,
// como el anime), un bocadillo a máquina, un dato grande y el texto estilo fansub debajo.
// Comparte motor, cortes de VHS, puntilla, grano, música y efectos con la plantilla «lista».

import { paginaReel, letras, maquina, palabras, estrella, sello, partirTitulo } from './plantilla.js';
import { ojiva, arcoFoto, enfasis } from '../carrusel/plantilla.js';

export const PULSOS_EXP = { intro: 6, escena: 8, outro: 5 };

export function duracionExplicativo(spec, bpm = 72) {
  const b = 60 / bpm;
  return (PULSOS_EXP.intro + spec.escenas.reduce((s, e) => s + (e.pulsos ?? PULSOS_EXP.escena), 0) + PULSOS_EXP.outro) * b;
}

// Suelo de las escenas y medidas del monigote (en px del vídeo).
const SUELO = 1240;
const SUELO_INTRO = 1520;
const FIG = { w: 400, h: 540, cadera: [200, 340] };

const EXP_CSS = `
.fig{position:absolute;overflow:visible;pointer-events:none;}
.fig line,.fig path.l{stroke:var(--luna);stroke-width:10;stroke-linecap:round;stroke-linejoin:round;fill:none;}
.fig .cab{stroke:var(--luna);stroke-width:10;fill:var(--noche);}
.fig .ojo{fill:var(--luna);}
.fig .acc{stroke:var(--vino-vivo);stroke-width:8;stroke-linecap:round;fill:none;}
.fig .accp{stroke:var(--plata);stroke-width:6;stroke-linecap:round;fill:none;}
.fig .lag{fill:var(--plata);opacity:0;}
.objeto{position:absolute;overflow:visible;}
.objeto .t{stroke:var(--plata);stroke-width:6;stroke-linecap:round;stroke-linejoin:round;fill:none;}
.objeto .tv{stroke:var(--vino-vivo);stroke-width:6;stroke-linecap:round;fill:none;}
.objeto .rel{fill:var(--vino);}
.objeto text{font-family:var(--dato);fill:var(--luna);letter-spacing:.04em;}
.bocadillo{position:absolute;max-width:560px;background:var(--noche);border:3px solid var(--plata);border-radius:30px;padding:22px 30px 20px;opacity:0;z-index:8;}
.bocadillo .mono{font-size:34px;line-height:1.35;color:var(--luna);white-space:normal;letter-spacing:.03em;}
.bocadillo::after{content:"";position:absolute;bottom:-26px;left:var(--cola,50%);width:30px;height:30px;background:var(--noche);border-right:3px solid var(--plata);border-bottom:3px solid var(--plata);transform:translateX(-50%) rotate(45deg) skew(10deg,10deg);}
.rotulo-exp{position:absolute;left:0;right:0;top:330px;text-align:center;font-size:32px;}
.dato-exp{font-family:var(--display);font-size:84px;line-height:1;color:var(--luna);opacity:0;}
.dato-exp em{font-style:italic;color:var(--plata);}
`;

// ── Monigote ────────────────────────────────────────────────────────────────
// Accesorio de cada papel, para distinguirlos sin color de piel ni rasgos.
const ACCESORIOS = {
  fan: `<path class="acc" d="M228,94 l26,-22 l4,30 z M228,94 l-14,-26 l30,-4 z"/><path class="accp" d="M162,130 q-10,40 -4,70 M238,130 q10,40 4,70"/>`,
  estudio: `<path class="acc" data-rol="corbata" d="M200,190 l-10,16 l10,60 l10,-60 z"/>`,
  cadena: `<path class="accp" d="M186,90 l-26,-46 M214,90 l26,-46"/><circle cx="160" cy="44" r="7" style="fill:var(--vino-vivo)"/><circle cx="240" cy="44" r="7" style="fill:var(--vino-vivo)"/>`,
  autor: `<circle class="accp" cx="182" cy="134" r="15"/><circle class="accp" cx="220" cy="134" r="15"/><path class="accp" d="M197,134 h8"/>`,
};

function monigote(m, t0, t1, b) {
  const poses = m.poses?.length ? m.poses : ['parado'];
  const dur = t1 - t0;
  // Cambios de pose repartidos en la escena; si camina, entra desde x0.
  const claves = poses.map((p, i) => ({ t: +(t0 + (i === 0 ? 0 : (i / poses.length) * dur)).toFixed(3), pose: p }));
  const datos = { x: m.x ?? 540, desde: m.camina ?? null, t0, mira: m.mira === 'izq' ? -1 : 1, claves, salto: b };
  return `<svg class="fig" data-anim="figura" data-t="${t0}" data-fig='${JSON.stringify(datos)}' width="${FIG.w}" height="${FIG.h}" viewBox="0 0 ${FIG.w} ${FIG.h}"
    style="left:${(m.x ?? 540) - FIG.cadera[0]}px;top:${SUELO - FIG.h + 10}px;opacity:0">
    <g class="cuerpo">
      <line class="pi1"/><line class="pi2"/><line class="pd1"/><line class="pd2"/>
      <line class="tor"/><line class="bi1"/><line class="bi2"/><line class="bd1"/><line class="bd2"/>
      <g class="cabeza"><circle class="cab" cx="200" cy="134" r="42"/>
        <circle class="ojo oi" cx="186" cy="128" r="5"/><circle class="ojo od" cx="214" cy="128" r="5"/>
        <path class="l boca" style="stroke-width:6"/>
        <circle class="lag l1" cx="182" cy="150" r="5"/><circle class="lag l2" cx="218" cy="156" r="5"/>
        ${ACCESORIOS[m.rol] ?? ''}
      </g>
    </g>
  </svg>`;
}

// ── Objetos dibujados ───────────────────────────────────────────────────────
// Todos se dibujan con el trazo (data-anim="draw") y sus textos aparecen después.
function objeto(o, a, b, img) {
  if (!o) return '';
  const cx = o.x ?? 540, cy = o.y ?? 535;
  const d = (extra = '') => `data-anim="draw" data-t="${a + .1}" data-d=".9" ${extra}`;
  // Aparición con fundido: el estilo de cada elemento ya lleva opacity:0 (un solo atributo style).
  const f = t => `data-anim="fade" data-t="${t}"`;
  let svg = '', html = '', w = 900, h = 420;
  switch (o.tipo) {
    case 'calendario': {
      // Cuatro bloques de tres meses: el año de la tele japonesa.
      const nombres = o.etiquetas ?? ['ENE–MAR', 'ABR–JUN', 'JUL–SEP', 'OCT–DIC'];
      const marca = o.marca ?? null;
      w = 900; h = 300;
      nombres.forEach((n, i) => {
        const x = 20 + i * 220;
        svg += `<rect class="t" ${d()} x="${x}" y="40" width="200" height="220" rx="10"/>`;
        svg += `<line class="t" ${d()} x1="${x}" y1="90" x2="${x + 200}" y2="90"/>`;
        if (marca === i || marca === 'todas') svg += `<rect class="rel" ${f(a + 1.2 + i * .12)} x="${x + 6}" y="96" width="188" height="158" rx="6" style="opacity:0"/>`;
        svg += `<text ${f(a + .7 + i * .1)} x="${x + 100}" y="76" font-size="28" text-anchor="middle" style="opacity:0">${n}</text>`;
        svg += `<text ${f(a + 1.2 + i * .12)} x="${x + 100}" y="196" font-size="64" text-anchor="middle" style="opacity:0;font-family:var(--display)">${i + 1}</text>`;
      });
      break;
    }
    case 'tira': {
      // Tira de película con N episodios que aparecen de uno en uno.
      const n = o.episodios ?? 12, cols = Math.min(n, 6), filas = Math.ceil(n / cols);
      w = 900; h = 40 + filas * 160;
      svg += `<rect class="t" ${d()} x="10" y="10" width="880" height="${h - 20}" rx="12"/>`;
      for (let i = 0; i < n; i++) {
        const c = i % cols, r = Math.floor(i / cols), x = 40 + c * 140, y = 40 + r * 160;
        const t = a + .8 + i * Math.min(.14, (b * 2.2) / n);
        svg += `<g ${f(t)} style="opacity:0"><rect class="${o.corte != null && i >= o.corte ? 'tv' : 't'}" x="${x}" y="${y}" width="120" height="120" rx="8"/>
          <text x="${x + 60}" y="${y + 80}" font-size="50" text-anchor="middle">${i + 1}</text></g>`;
      }
      if (o.corte != null) {
        const c = o.corte % cols, r = Math.floor(o.corte / cols), x = 30 + c * 140;
        svg += `<line class="tv" ${d(`data-t="${a + 2.4}"`).replace(`data-t="${a + .1}" `, '')} x1="${x}" y1="${20 + r * 160}" x2="${x}" y2="${180 + r * 160}" style="stroke-dasharray:14 12"/>`;
      }
      break;
    }
    case 'tele': {
      // Tele de tubo con antena; en la pantalla, texto o la portada oficial del anime.
      w = 520; h = 420;
      svg += `<path class="t" ${d()} d="M200,70 L160,10 M320,70 L360,10"/>`;
      svg += `<rect class="t" ${d()} x="20" y="70" width="480" height="320" rx="34"/>`;
      svg += `<rect class="t" ${d()} x="56" y="100" width="340" height="260" rx="22"/>`;
      svg += `<circle class="t" ${d()} cx="450" cy="160" r="20"/><circle class="t" ${d()} cx="450" cy="230" r="14"/>`;
      if (img) html += `<div ${f(a + .9)} style="opacity:0;position:absolute;left:62px;top:106px;width:328px;height:248px;border-radius:18px;overflow:hidden">${arcoFoto(img)}</div>`;
      if (o.pantalla) html += `<div ${f(a + 1.1)} style="opacity:0;position:absolute;left:62px;top:${img ? 290 : 106}px;width:328px;height:${img ? 64 : 248}px;display:grid;place-items:center;text-align:center;font-family:var(--dato);font-size:${img ? 26 : 44}px;color:var(--luna);letter-spacing:.04em;${img ? 'background:rgba(14,13,15,.78);' : ''}">${o.pantalla}</div>`;
      break;
    }
    case 'tijeras': {
      // Una temporada cortada en dos: dos bloques y unas tijeras que pasan por el medio.
      w = 900; h = 360;
      svg += `<rect class="t" ${d()} x="20" y="120" width="380" height="140" rx="10"/>`;
      svg += `<rect class="t" ${d()} x="500" y="120" width="380" height="140" rx="10"/>`;
      svg += `<text ${f(a + .8)} x="210" y="205" font-size="40" text-anchor="middle" style="opacity:0">${o.izquierda ?? 'PARTE 1'}</text>`;
      svg += `<text ${f(a + .8)} x="690" y="205" font-size="40" text-anchor="middle" style="opacity:0">${o.derecha ?? 'PARTE 2'}</text>`;
      svg += `<g ${f(a + 1.4)} style="opacity:0"><line class="tv" x1="450" y1="70" x2="450" y2="310" style="stroke-dasharray:16 14"/>
        <circle class="t" cx="420" cy="40" r="22"/><circle class="t" cx="480" cy="40" r="22"/><path class="t" d="M436,56 L462,120 M464,56 L438,120"/></g>`;
      if (o.pausa) svg += `<text ${f(a + 1.9)} x="450" y="345" font-size="30" text-anchor="middle" style="opacity:0;fill:var(--vino-vivo)">${o.pausa}</text>`;
      break;
    }
    case 'reloj': {
      w = 360; h = 420;
      svg += `<path class="t" ${d()} d="M60,20 H300 M60,400 H300 M90,20 C90,150 180,170 180,210 C180,250 90,270 90,400 M270,20 C270,150 180,170 180,210 C180,250 270,270 270,400"/>`;
      svg += `<path class="rel" ${f(a + 1)} d="M120,90 H240 C230,140 190,170 180,190 C170,170 130,140 120,90 Z M110,390 C130,330 170,310 180,300 C190,310 230,330 250,390 Z" style="opacity:0"/>`;
      if (o.texto) svg += `<text ${f(a + 1.3)} x="180" y="460" font-size="36" text-anchor="middle" style="opacity:0">${o.texto}</text>`;
      h = 480;
      break;
    }
    case 'estudio': {
      w = 620; h = 420;
      svg += `<path class="t" ${d()} d="M40,400 V140 L310,40 L580,140 V400 Z"/>`;
      for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) svg += `<rect class="t" ${d()} x="${100 + c * 115}" y="${190 + r * 90}" width="70" height="60" rx="6"/>`;
      svg += `<rect class="rel" ${f(a + 1)} x="200" y="110" width="220" height="56" rx="8" style="opacity:0"/>`;
      svg += `<text ${f(a + 1.1)} x="310" y="150" font-size="34" text-anchor="middle" style="opacity:0">${o.letrero ?? 'ESTUDIO'}</text>`;
      break;
    }
  }
  // Todos los objetos caben en la franja de arriba (de 400 a 670 px) salvo que la ficha diga otra escala.
  const sc = o.escala ?? Math.min(1, 270 / h, 900 / w);
  return `<div class="objeto" style="left:${cx - w * sc / 2}px;top:${cy - h * sc / 2}px;width:${w}px;height:${h}px;transform:scale(${sc});transform-origin:0 0">
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible">${svg}</svg>${html}</div>`;
}

// ── Montaje ────────────────────────────────────────────────────────────────
export function buildReelExplicativo(spec, imgs = {}, bpm = 72) {
  const b = 60 / bpm;
  const cortes = [], escenas = [];
  const eventos = [{ tipo: 'play', t: 0 }];
  const teclas = (t0, d, texto) => { const k = [...texto].length; for (let i = 0; i < k; i++) if (texto[i] !== ' ') eventos.push({ tipo: 'tecla', t: t0 + (i / k) * d, vol: .7 + ((i * 37) % 5) / 10 }); };
  const ritmo = texto => Math.min(1.8, Math.max(.5, [...texto].length * .034));

  // INTRO: rótulo, título, subtítulo y una fan que saluda.
  const ti = PULSOS_EXP.intro * b;
  const tit = (spec.titulo ?? []).map(enfasis);
  escenas.push(`<div class="esc" data-in="0" data-out="${ti}">
    <div style="position:absolute;left:0;right:0;top:470px;text-align:center">
      ${maquina(spec.etiqueta ?? 'EXPLICADO CON MONIGOTES', .15, .8, 'font-size:30px;color:var(--plata)')}
      <div style="margin-top:44px;font-size:${(spec.titulo ?? []).some(l => l.length > 12) ? 118 : 140}px">${letras(tit, .45)}</div>
      <div data-anim="line" data-t="1.25" style="width:420px;height:2px;background:var(--plata);margin:44px auto 0;transform:scaleX(0)"></div>
      <div data-anim="fade" data-t="1.45" style="font-family:var(--display);font-style:italic;font-size:58px;line-height:1.1;color:var(--plata);margin:30px auto 0;max-width:860px;opacity:0;text-wrap:balance">${spec.subtitulo ?? ''}</div>
    </div>
    <svg width="560" height="10" style="position:absolute;left:260px;top:${SUELO_INTRO}px;overflow:visible"><line data-anim="draw" data-t=".2" data-d=".8" x1="0" y1="2" x2="560" y2="2" style="stroke:var(--plata);stroke-width:3"/></svg>
    ${monigote({ rol: spec.anfitriona ?? 'fan', x: 540, poses: ['saluda', 'parado', 'senala'] }, .3, ti, b).replace(`top:${SUELO - FIG.h + 10}px`, `top:${SUELO_INTRO - FIG.h + 10}px`)}
    ${estrella(190, 560, 50, .6)}${estrella(890, 620, 34, .9)}
  </div>`);
  teclas(.15, .8, spec.etiqueta ?? 'EXPLICADO CON MONIGOTES');
  eventos.push({ tipo: 'campana', t: .6, vol: .8 });
  let t = ti;
  cortes.push(t);

  // ESCENAS
  spec.escenas.forEach((e, i) => {
    const a = t, dur = (e.pulsos ?? PULSOS_EXP.escena) * b, fin = a + dur;
    const figs = (e.monigotes ?? []).map(m => monigote(m, a, fin, b)).join('');
    let boca = '';
    if (e.bocadillo) {
      const m = (e.monigotes ?? [])[e.bocadillo.de ?? 0] ?? { x: 540 };
      // Al lado de la cabeza, del lado contrario a donde está el monigote, con la cola hacia él.
      const ancho = 560, mx = m.x ?? 540, izq = mx <= 540;
      const x = Math.min(1020 - ancho, Math.max(60, izq ? mx + 70 : mx - 70 - ancho));
      const cola = izq ? 44 : ancho - 44;
      const tb = a + b, db = ritmo(e.bocadillo.texto);
      const top = e.bocadillo.y ?? 690;
      boca = `<div class="bocadillo" data-anim="fade" data-t="${tb - .1}" style="left:${x}px;top:${top}px;width:${ancho}px;--cola:${cola}px">${maquina(e.bocadillo.texto, tb, db, 'display:block')}</div>`;
      teclas(tb, db, e.bocadillo.texto);
    }
    const datoHtml = e.dato ? `<div class="dato-exp" data-anim="fade" data-t="${a + 1.5 * b}">${enfasis(e.dato)}</div>` : '';
    escenas.push(`<div class="esc" data-in="${a}" data-out="${fin}">
      <div class="rotulo-exp">
        <span class="mono" data-anim="fade" data-t="${a + .15}" style="color:var(--vino-vivo);opacity:0;display:inline-block">${String(i + 1).padStart(2, '0')}</span>
        <span class="mono" style="color:var(--plata)"> · </span>
        <span style="display:inline-block;min-width:380px;text-align:left">${maquina(e.rotulo ?? '', a + .25, .5, 'color:var(--plata);display:inline-block')}</span>
      </div>
      ${objeto(e.objeto, a, b, e.foto ? imgs[e.foto] : null)}
      <svg width="840" height="10" style="position:absolute;left:120px;top:${SUELO}px;overflow:visible"><line data-anim="draw" data-t="${a}" data-d=".6" x1="0" y1="2" x2="840" y2="2" style="stroke:var(--filete);stroke-width:3"/></svg>
      ${figs}
      ${boca}
      <div style="position:absolute;left:90px;right:90px;top:${SUELO + 50}px;display:flex;flex-direction:column;align-items:center;text-align:center">
        ${datoHtml}
        ${palabras(e.texto ?? '', a + 2 * b, `position:static;margin-top:${e.dato ? 34 : 0}px;max-width:880px;text-wrap:balance;font-size:42px`)}
      </div>
    </div>`);
    eventos.push({ tipo: 'pagina', t: a + .1 });
    if (e.dato) eventos.push({ tipo: 'campana', t: a + 1.5 * b, vol: .6 });
    teclas(a + .25, .5, e.rotulo ?? '');
    t = fin;
    cortes.push(t);
  });

  // CIERRE (igual que la plantilla lista, para que la cuenta tenga un final reconocible).
  const o = t, final = o + PULSOS_EXP.outro * b, golpeSello = o + 2 * b;
  escenas.push(`<div class="esc" data-in="${o}" data-out="${final + 1}">
    <svg width="900" height="1150" style="position:absolute;left:90px;top:380px;overflow:visible"><path data-anim="draw" data-t="${o + .05}" data-d="1" d="${ojiva(900, 1150)}" style="fill:none;stroke:var(--plata);stroke-width:3"/></svg>
    <div data-anim="fade" data-t="${o + .5}" class="luna-c" style="left:516px;top:330px;width:40px;height:40px;box-shadow:12px -3px 0 0 var(--plata);opacity:0"></div>
    <div style="position:absolute;left:110px;right:110px;top:800px;text-align:center;font-size:${spec.cierre.pregunta.some(l => l.replace(/\*/g, '').length > 13) ? 104 : 124}px">${letras(spec.cierre.pregunta.map(enfasis), o + .35)}</div>
    <div style="position:absolute;left:0;right:0;top:1160px;text-align:center">${maquina(spec.cierre.cta, o + 1.05, .7, 'font-size:32px;color:var(--plata)')}</div>
    <div style="position:absolute;left:0;right:0;top:1400px;display:flex;justify-content:center;align-items:center;gap:30px">
      <div data-anim="fade" data-t="${o + 1.5}" style="font-family:var(--display);font-style:italic;font-size:84px;opacity:0">caba<span style="color:var(--vino-vivo)">.</span>kami</div>
      ${sello(golpeSello - .32)}
    </div>
    ${estrella(150, 800, 40, o + .6)}${estrella(930, 980, 30, o + .9)}
  </div>`);
  eventos.push({ tipo: 'cerilla', t: o + .1 }, { tipo: 'sello', t: golpeSello }, { tipo: 'stop', t: final - .7 });
  teclas(o + 1.05, .7, spec.cierre.cta);
  cortes.forEach(c => eventos.push({ tipo: 'glitch', t: c - .14 }, { tipo: 'impacto', t: c }));

  return { html: paginaReel(escenas.join('\n'), cortes, EXP_CSS, FIG_JS), eventos, cortes, duracion: final };
}

// ── Animación de los monigotes (lado navegador) ─────────────────────────────
// Ángulos en grados medidos desde «hacia abajo»; positivo hacia la derecha de la pantalla.
// brazos: [brazo, antebrazo]; piernas: [muslo, pantorrilla]; tor: inclinación del tronco.
const FIG_JS = `
const POSES = {
  parado:    { tor: 0,  bi: [-14, -8],   bd: [14, 8],     pi: [-7, -3],  pd: [7, 3],   boca: 'sonrisa' },
  saluda:    { tor: -3, bi: [-14, -8],   bd: [140, 175],  pi: [-7, -3],  pd: [7, 3],   boca: 'abierta', ola: 1 },
  senala:    { tor: 4,  bi: [-14, -8],   bd: [95, 92],    pi: [-9, -4],  pd: [9, 4],   boca: 'abierta' },
  senalaIzq: { tor: -4, bi: [-95, -92],  bd: [14, 8],     pi: [-9, -4],  pd: [9, 4],   boca: 'abierta' },
  pensar:    { tor: -2, bi: [-25, 70],   bd: [60, -146],  pi: [-6, -3],  pd: [8, 3],   boca: 'linea' },
  encoge:    { tor: 0,  bi: [-60, -160], bd: [60, 160],   pi: [-8, -3],  pd: [8, 3],   boca: 'linea' },
  sorpresa:  { tor: 0,  bi: [-150, -170],bd: [150, 170],  pi: [-12, -6], pd: [12, 6],  boca: 'o', salto: 1 },
  celebra:   { tor: 0,  bi: [-135, -150],bd: [135, 150],  pi: [-10, -4], pd: [10, 4],  boca: 'abierta', salto: 2 },
  llora:     { tor: 6,  bi: [-120, 126], bd: [120, -126], pi: [-6, -2],  pd: [6, 2],   boca: 'triste', lagrimas: 1 },
  triste:    { tor: 10, bi: [-6, -3],    bd: [6, 3],      pi: [-5, -2],  pd: [5, 2],   boca: 'triste' },
  espera:    { tor: -2, bi: [-22, 72],   bd: [22, -72],   pi: [-7, -3],  pd: [10, 30], boca: 'linea', golpeteo: 1 },
};
const L = { tor: 150, cuello: 22, brazo: 75, ante: 70, muslo: 95, pierna: 95 };
const rad = g => g * Math.PI / 180;
const dirv = g => [Math.sin(rad(g)), Math.cos(rad(g))];
const mezclaPose = (a, b, p) => {
  const r = {};
  for (const k of ['tor']) r[k] = a[k] + (b[k] - a[k]) * p;
  for (const k of ['bi', 'bd', 'pi', 'pd']) r[k] = [a[k][0] + (b[k][0] - a[k][0]) * p, a[k][1] + (b[k][1] - a[k][1]) * p];
  const dom = p < .5 ? a : b;
  r.boca = dom.boca; r.ola = dom.ola; r.salto = dom.salto; r.lagrimas = dom.lagrimas; r.golpeteo = dom.golpeteo;
  return r;
};
const BOCAS = {
  sonrisa: 'M188,150 Q200,162 212,150', abierta: 'M186,148 Q200,170 214,148 Z', o: 'M200,146 m-8,8 a8,8 0 1,0 16,0 a8,8 0 1,0 -16,0',
  triste: 'M188,160 Q200,148 212,160', linea: 'M189,155 L211,155',
};
const setL = (el, x1, y1, x2, y2) => { el.setAttribute('x1', x1); el.setAttribute('y1', y1); el.setAttribute('x2', x2); el.setAttribute('y2', y2); };

function pintarFigura(svg, tReal, t) {
  const F = JSON.parse(svg.dataset.fig);
  const visible = tReal >= F.t0;
  svg.style.opacity = visible ? Math.min(1, (tReal - F.t0) / .25) : 0;
  if (!visible) return;
  // Pose actual: transición de 0,35 s entre claves, contada de a dos.
  let i = 0; while (i + 1 < F.claves.length && t >= F.claves[i + 1].t) i++;
  const act = POSES[F.claves[i].pose] || POSES.parado;
  const prev = i > 0 ? (POSES[F.claves[i - 1].pose] || POSES.parado) : act;
  const p = i > 0 ? Math.min(1, (t - F.claves[i].t) / .35) : 1;
  const P = mezclaPose(prev, act, outBack(p) > 1 ? 1 : outBack(p));
  // Entrada caminando
  let x = F.x, andando = false;
  if (F.desde != null) { const q = Math.min(1, (tReal - F.t0) / 1.1); x = F.desde + (F.x - F.desde) * inOut(q); andando = q < 1; }
  const fase = t * 7;
  if (andando) { P.pi = [-24 * Math.sin(fase), -24 * Math.sin(fase) - 12]; P.pd = [24 * Math.sin(fase), 24 * Math.sin(fase) - 12]; }
  if (P.golpeteo) P.pd = [10, 30 + (Math.floor(t * 4) % 2) * 22];
  const resp = Math.sin(t * 3) * 3;
  const salto = P.salto ? -Math.abs(Math.sin(t * Math.PI * (P.salto === 2 ? 2.4 : 1.2))) * 26 : 0;
  // Esqueleto
  const cx = 200, cy = 340 + salto + resp * .3;
  const [tx, ty] = dirv(180 + P.tor);
  const hom = [cx + tx * (L.tor - 10), cy + ty * (L.tor - 10)], cue = [cx + tx * L.tor, cy + ty * L.tor];
  const q = s => svg.querySelector(s);
  setL(q('.tor'), cx, cy, cue[0], cue[1]);
  const brazo = (cls, ang, ola) => {
    const [ux, uy] = dirv(ang[0] + P.tor), codo = [hom[0] + ux * L.brazo, hom[1] + uy * L.brazo];
    const [fx, fy] = dirv(ang[1] + P.tor + (ola ? Math.sin(t * 9) * 22 : 0)), mano = [codo[0] + fx * L.ante, codo[1] + fy * L.ante];
    setL(q('.' + cls + '1'), hom[0], hom[1], codo[0], codo[1]); setL(q('.' + cls + '2'), codo[0], codo[1], mano[0], mano[1]);
  };
  brazo('bi', P.bi, false); brazo('bd', P.bd, P.ola);
  const pierna = (cls, ang) => {
    const [ux, uy] = dirv(ang[0]), rod = [cx + ux * L.muslo, cy + uy * L.muslo];
    const [fx, fy] = dirv(ang[1]), pie = [rod[0] + fx * L.pierna, rod[1] + fy * L.pierna];
    setL(q('.' + cls + '1'), cx, cy, rod[0], rod[1]); setL(q('.' + cls + '2'), rod[0], rod[1], pie[0], pie[1]);
  };
  pierna('pi', P.pi); pierna('pd', P.pd);
  // Cabeza: sigue al cuello, parpadea y cambia de boca.
  const hx = cue[0] + tx * (L.cuello + 42) - 200, hy = cue[1] + ty * (L.cuello + 42) - 134;
  q('.cabeza').setAttribute('transform', 'translate(' + hx + ',' + hy + ') rotate(' + (P.tor * .6) + ',200,134)');
  q('.boca').setAttribute('d', BOCAS[P.boca] || BOCAS.sonrisa);
  const parp = (t * 1.1 + F.x / 300) % 3.2 < .09;
  svg.querySelectorAll('.ojo').forEach(o => o.setAttribute('r', parp ? 1.5 : 5));
  svg.querySelectorAll('.lag').forEach((l, k) => { const ph = (t * 1.6 + k * .5) % 1; l.style.opacity = P.lagrimas ? 1 - ph : 0; l.setAttribute('cy', 150 + k * 6 + ph * 60); });
  svg.style.left = (x - 200) + 'px';
  svg.style.transform = F.mira < 0 ? 'scaleX(-1)' : '';
}

const renderBase = window.render;
window.render = tReal => {
  renderBase(tReal);
  const t = Math.floor(tReal * 12 + 1e-6) / 12;
  document.querySelectorAll('[data-anim="figura"]').forEach(svg => {
    if (svg.closest('.esc').style.display === 'none') return;
    pintarFigura(svg, tReal, t);
  });
};
`;
