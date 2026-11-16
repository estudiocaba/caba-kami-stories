// Plantilla de reel «Lista» de @caba.kami — motion graphics gótico romántico noventero.
// Vídeo vertical 1080×1920, ~18 s: intro → [elemento → eyecatch] × n → cierre.
//
// Lenguaje de movimiento:
//  · cortes con fallo de VHS (separación RGB + desplazamiento en franjas + destello)
//  · el arco ojival se dibuja y la foto sube como un telón, con zoom lento y barrido de luz
//  · títulos letra a letra desde desenfoque con temblor de color; etiquetas a máquina;
//    cifras que cuentan; subtítulos fansub palabra a palabra
//  · eyecatch de anime de los 90 entre elementos; sello 神 estampado al final
//  · puntilla que se desliza, pétalos vino y polvo plata, grano y banda de tracking
//
// Todo se calcula en window.render(t) a partir del tiempo: el vídeo se graba fotograma a fotograma.

import { CSS, FONTS, puntilla, arcoFoto, ojiva } from '../carrusel/plantilla.js';

export const TIEMPOS = { intro: 2.8, item: 3.8, eyecatch: 0.7, outro: 3.4 };

export function duracionLista(spec) {
  const n = spec.items.length;
  return TIEMPOS.intro + n * TIEMPOS.item + (n - 1) * TIEMPOS.eyecatch + TIEMPOS.outro;
}

const REEL_CSS = `
body{margin:0;background:#000;}
.reel{width:1080px;height:1920px;position:relative;overflow:hidden;background:var(--noche);color:var(--luna);}
.contenido{position:absolute;inset:0;}
.esc{position:absolute;inset:0;display:none;}
.l{display:inline-block;white-space:pre;}
.lineas{position:absolute;inset:0;pointer-events:none;z-index:30;opacity:.08;background:repeating-linear-gradient(to bottom, rgba(236,235,238,.55) 0 1px, transparent 1px 4px);}
.grano-v{position:absolute;inset:-40px;pointer-events:none;z-index:31;opacity:.1;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");}
.tracking{position:absolute;left:0;right:0;height:70px;z-index:29;pointer-events:none;opacity:.07;background:repeating-linear-gradient(90deg, rgba(236,235,238,.9) 0 3px, transparent 3px 9px);filter:blur(1px);}
.flash{position:absolute;inset:0;z-index:32;background:var(--luna);opacity:0;pointer-events:none;}
.vineta{position:absolute;inset:0;z-index:28;pointer-events:none;background:radial-gradient(ellipse 90% 75% at 50% 45%, rgba(14,13,15,0) 60%, rgba(14,13,15,.75) 100%);}
.titulo-v{font-family:var(--display);font-style:italic;font-weight:600;line-height:.95;}
.mono{font-family:var(--dato);letter-spacing:.18em;}
.fansub{position:absolute;left:90px;right:90px;text-align:center;font-family:var(--texto);font-weight:700;font-size:46px;line-height:1.35;color:var(--luna);
  text-shadow:-3px -3px 0 var(--noche),3px -3px 0 var(--noche),-3px 3px 0 var(--noche),3px 3px 0 var(--noche),0 0 18px rgba(14,13,15,.9);}
.fansub .w{display:inline-block;opacity:0;}
.rec-v{position:absolute;left:72px;top:250px;font-family:var(--dato);font-size:26px;letter-spacing:.14em;color:var(--niebla);display:flex;gap:18px;align-items:center;z-index:5;}
.rec-v .p{width:18px;height:18px;border-radius:50%;background:var(--vino-vivo);}
.particula{position:absolute;pointer-events:none;z-index:6;}
.petalo{border-radius:60% 0 60% 0;background:var(--vino-vivo);}
.polvo{border-radius:50%;background:var(--plata);}
.destello{position:absolute;z-index:7;}
`;

// ── Constructores (lado Node) ──────────────────────────────────────────────
const letras = (lineas, t, extra = '') => {
  let i = 0;
  const html = lineas.map(l => [...l].map(ch => `<span class="l" data-i="${i++}">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('')).join('<br>');
  return `<div class="titulo-v" data-anim="letters" data-t="${t}" ${extra}>${html}</div>`;
};
const maquina = (texto, t, d, style = '') =>
  `<div class="mono" data-anim="type" data-t="${t}" data-d="${d}" data-text="${texto.replace(/"/g, '&quot;')}" style="${style}"></div>`;
const palabras = (texto, t, style) =>
  `<div class="fansub" data-anim="words" data-t="${t}" style="${style}">${texto.split(' ').map(w => `<span class="w">${w}</span>`).join(' ')}</div>`;
const estrella = (x, y, s, t) =>
  `<svg class="destello" data-anim="twinkle" data-t="${t}" width="${s}" height="${s}" viewBox="-1 -1 2 2" style="left:${x - s / 2}px;top:${y - s / 2}px;opacity:0"><path d="M0,-1 C.08,-.08 .08,-.08 1,0 C.08,.08 .08,.08 0,1 C-.08,.08 -.08,.08 -1,0 C-.08,-.08 -.08,-.08 0,-1Z" style="fill:var(--plata)"/></svg>`;

function arcoAnimado(x, y, w, h, img, t, dur) {
  const iw = w - 28, ih = h - 14;
  return `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px">
    <div style="position:absolute;left:14px;top:14px;width:${iw}px;height:${ih}px;clip-path:path('${ojiva(iw, ih, true)}');background:var(--humo-alto);overflow:hidden">
      <div data-anim="reveal" data-t="${t + .3}" data-d=".7" style="position:absolute;inset:0">
        <div data-anim="kenburns" data-t="${t}" data-d="${dur}" style="position:absolute;inset:0">${arcoFoto(img)}</div>
        <div data-anim="leak" data-t="${t + 1.4}" data-d="1.1" style="position:absolute;top:-10%;bottom:-10%;left:0;width:55%;background:linear-gradient(100deg, rgba(236,235,238,0), rgba(236,235,238,.32), rgba(236,235,238,0));mix-blend-mode:screen"></div>
      </div>
    </div>
    <svg width="${w}" height="${h}" style="position:absolute;left:0;top:0;overflow:visible">
      <path data-anim="draw" data-t="${t}" data-d=".75" d="${ojiva(w, h)}" style="fill:none;stroke:var(--plata);stroke-width:3"/>
    </svg>
  </div>`;
}

function sello(t, size = 120) {
  return `<div data-anim="stamp" data-t="${t}" style="width:${size}px;height:${size}px;background:var(--vino);border-radius:6px;display:grid;place-items:center;box-shadow:inset 0 0 0 4px var(--vino),inset 0 0 0 6px var(--plata);opacity:0"><span style="font-family:var(--kanji);font-weight:700;font-size:${size * .6}px;line-height:1;color:var(--luna)">神</span></div>`;
}

// Partículas deterministas (pétalos vino y polvo plata).
function particulas() {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const out = [];
  for (let k = 0; k < 16; k++) {
    const s = 14 + rnd() * 16;
    out.push(`<div class="particula petalo" data-p="${rnd()},${rnd()},${30 + rnd() * 50},${rnd() * 6},${(rnd() - .5) * 120}" style="width:${s}px;height:${s * .7}px;opacity:${.35 + rnd() * .3}"></div>`);
  }
  for (let k = 0; k < 26; k++) {
    const s = 3 + rnd() * 4;
    out.push(`<div class="particula polvo" data-p="${rnd()},${rnd()},${15 + rnd() * 35},${rnd() * 6},0" style="width:${s}px;height:${s}px;opacity:${.3 + rnd() * .5}"></div>`);
  }
  return out.join('');
}

export function buildReelLista(spec, imgs) {
  const T = TIEMPOS;
  const n = spec.items.length;
  const cortes = [];
  const escenas = [];
  let t = 0;

  // INTRO
  escenas.push(`<div class="esc" data-in="0" data-out="${T.intro}">
    <div data-anim="ghost" data-t="0" style="position:absolute;left:0;right:0;top:420px;text-align:center;font-family:var(--kanji);font-weight:700;font-size:900px;line-height:1;color:var(--plata);opacity:0">${spec.kanji ?? '夜'}</div>
    <div style="position:absolute;left:0;right:0;top:640px;text-align:center">
      ${maquina(spec.etiqueta ?? '', .15, .7, 'font-size:30px;color:var(--plata)')}
      <div style="margin-top:46px;font-size:150px">${letras(spec.titulo, .45)}</div>
      <div data-anim="line" data-t="1.25" style="width:420px;height:2px;background:var(--plata);margin:44px auto 0;transform:scaleX(0)"></div>
      <div data-anim="fade" data-t="1.45" style="font-family:var(--display);font-style:italic;font-weight:500;font-size:62px;color:var(--plata);margin-top:30px;opacity:0">${spec.subtitulo ?? ''}</div>
    </div>
    ${estrella(190, 590, 54, .6)}${estrella(890, 700, 36, .9)}${estrella(220, 1230, 26, 1.2)}${estrella(870, 1290, 46, 1.0)}
  </div>`);
  t = T.intro;
  cortes.push(t);

  spec.items.forEach((it, i) => {
    const a = t, b = t + T.item;
    escenas.push(`<div class="esc" data-in="${a}" data-out="${b}">
      <div style="position:absolute;left:0;right:0;top:330px;text-align:center;font-size:32px">
        <span class="mono" data-anim="fade" data-t="${a + .2}" style="color:var(--vino-vivo);opacity:0;display:inline-block">${String(i + 1).padStart(2, '0')}</span>
        <span class="mono" style="color:var(--plata)"> · </span>
        <span style="display:inline-block;min-width:420px;text-align:left">${maquina(it.etiqueta, a + .3, .55, 'color:var(--plata);display:inline-block')}</span>
      </div>
      ${arcoAnimado(210, 410, 660, 820, imgs[i], a, T.item)}
      <div style="position:absolute;left:60px;right:60px;top:1270px;text-align:center;font-size:${it.nombre.length > 16 ? 80 : 108}px">${letras([it.nombre], a + .75)}</div>
      <div class="mono" data-anim="fade" data-t="${a + 1.05}" style="position:absolute;left:0;right:0;top:${it.nombre.length > 16 ? 1380 : 1405}px;text-align:center;font-weight:500;font-size:34px;letter-spacing:.12em;color:var(--luna);opacity:0">${it.datoHtml ?? it.dato ?? ''}</div>
      ${palabras(it.subtitulo ?? '', a + 1.35, 'top:1490px')}
      ${estrella(180, 520, 44, a + .5)}${estrella(900, 720, 28, a + .8)}${estrella(195, 1120, 20, a + 1.1)}
    </div>`);
    t = b;
    cortes.push(t);
    if (i < n - 1) {
      const e = t;
      escenas.push(`<div class="esc" data-in="${e}" data-out="${e + T.eyecatch}" style="background:var(--vino)">
        <div data-anim="eyecatch" data-t="${e}" style="position:absolute;left:0;right:0;top:560px;text-align:center;font-family:var(--kanji);font-weight:700;font-size:620px;line-height:1;color:var(--luna)">${it.kanji ?? spec.kanji ?? '夜'}</div>
        <div class="mono" style="position:absolute;left:0;right:0;top:1300px;text-align:center;font-size:30px;color:var(--plata)">▶ SIGUIENTE · ${String(i + 2).padStart(2, '0')}</div>
        <div style="position:absolute;left:0;right:0;top:1400px;text-align:center;font-family:var(--display);font-style:italic;font-weight:600;font-size:64px">caba.kami</div>
      </div>`);
      t = e + T.eyecatch;
      cortes.push(t);
    }
  });

  // CIERRE
  const o = t, fin = o + T.outro;
  escenas.push(`<div class="esc" data-in="${o}" data-out="${fin + 1}">
    <svg width="900" height="1150" style="position:absolute;left:90px;top:380px;overflow:visible"><path data-anim="draw" data-t="${o + .05}" data-d="1" d="${ojiva(900, 1150)}" style="fill:none;stroke:var(--plata);stroke-width:3"/></svg>
    <div style="position:absolute;left:110px;right:110px;top:820px;text-align:center;font-size:124px">${letras(spec.cierre.pregunta, o + .35)}</div>
    <div style="position:absolute;left:0;right:0;top:1160px;text-align:center">${maquina(spec.cierre.cta, o + 1.05, .7, 'font-size:32px;color:var(--plata)')}</div>
    <div style="position:absolute;left:0;right:0;top:1400px;display:flex;justify-content:center;align-items:center;gap:30px">
      <div data-anim="fade" data-t="${o + 1.5}" style="font-family:var(--display);font-style:italic;font-weight:600;font-size:76px;opacity:0">caba<span style="color:var(--vino-vivo)">.</span>kami</div>
      ${sello(o + 1.75)}
    </div>
    ${estrella(150, 800, 40, o + .6)}${estrella(930, 980, 30, o + .9)}${estrella(170, 1300, 22, o + 1.2)}
  </div>`);

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
${FONTS.map(f => `<link rel="stylesheet" href="${f}">`).join('\n')}
<style>${CSS}${REEL_CSS}</style></head><body>
<svg width="0" height="0" style="position:absolute">
  <filter id="vhs" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
    <feTurbulence id="vhs-turb" type="fractalNoise" baseFrequency="0.0008 0.09" numOctaves="1" seed="3" result="ruido"/>
    <feDisplacementMap id="vhs-disp" in="SourceGraphic" in2="ruido" scale="0" xChannelSelector="R" yChannelSelector="G" result="desplazado"/>
    <feColorMatrix in="desplazado" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="rojo"/>
    <feOffset id="vhs-r" in="rojo" dx="0" dy="0" result="rojo2"/>
    <feColorMatrix in="desplazado" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cian"/>
    <feOffset id="vhs-c" in="cian" dx="0" dy="0" result="cian2"/>
    <feBlend in="rojo2" in2="cian2" mode="screen"/>
  </filter>
</svg>
<div class="reel">
  <div class="contenido" id="contenido">
    <div id="encaje" style="position:absolute;left:0;top:0;width:1200px">${puntilla(.38).replace('width="1080"', 'width="1200"').replace('<rect width="1080"', '<rect width="1200"')}</div>
    <div class="rec-v"><span class="p"></span>▶ PLAY&nbsp;&nbsp;@CABA.KAMI</div>
    ${escenas.join('\n')}
    ${particulas()}
  </div>
  <div class="vineta"></div><div class="tracking" id="tracking"></div><div class="lineas"></div><div class="grano-v"></div><div class="flash" id="flash"></div>
</div>
<script>
const CORTES = ${JSON.stringify(cortes)};
${RENDER_JS}
</script></body></html>`;
}

// ── Motor de animación (lado navegador) ────────────────────────────────────
const RENDER_JS = `
const clamp = x => x < 0 ? 0 : x > 1 ? 1 : x;
const outExpo = x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
const inOut = x => x * x * (3 - 2 * x);
const outBack = x => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const hash = n => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };

// Preparación: longitudes de los trazos y textos de máquina.
document.querySelectorAll('[data-anim="draw"]').forEach(p => {
  const L = p.getTotalLength(); p.dataset.len = L; p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
});

window.render = t => {
  const contenido = document.getElementById('contenido');
  // Escenas: cortes secos (el fallo de VHS los tapa).
  document.querySelectorAll('.esc').forEach(e => {
    e.style.display = (t >= +e.dataset.in && t < +e.dataset.out) ? 'block' : 'none';
  });

  document.querySelectorAll('[data-anim]').forEach(el => {
    const t0 = +el.dataset.t, d = +(el.dataset.d || .6), x = t - t0;
    switch (el.dataset.anim) {
      case 'letters': {
        const ls = el.querySelectorAll('.l');
        ls.forEach(l => {
          const p = outExpo(clamp((x - l.dataset.i * .035) / .65));
          l.style.opacity = p;
          l.style.transform = 'translateY(' + ((1 - p) * 70) + 'px)';
          l.style.filter = p < 1 ? 'blur(' + ((1 - p) * 10) + 'px)' : 'none';
        });
        const s = (1 - clamp(x / 1.3)) * 9;
        el.style.textShadow = s > .2 ? (-s) + 'px 0 0 rgba(184,48,77,.75),' + s + 'px 0 0 rgba(201,199,203,.5)' : '-1.5px 0 0 rgba(184,48,77,.45),1.5px 0 0 rgba(201,199,203,.3)';
        break;
      }
      case 'type': {
        const txt = el.dataset.text, k = Math.floor(clamp(x / d) * txt.length);
        const cursor = x > 0 && x < d + .5 && Math.floor(t * 5) % 2 === 0 ? '▌' : '';
        el.textContent = txt.slice(0, x > 0 ? k : 0) + cursor;
        break;
      }
      case 'fade': {
        const p = outExpo(clamp(x / .6));
        el.style.opacity = p; el.style.transform = 'translateY(' + ((1 - p) * 30) + 'px)';
        el.querySelectorAll('[data-count]').forEach(c => {
          const v = +c.dataset.count * outExpo(clamp(x / 1.1)), dec = +(c.dataset.dec || 0);
          c.textContent = v.toFixed(dec).replace('.', ',');
        });
        break;
      }
      case 'line': el.style.transform = 'scaleX(' + outExpo(clamp(x / .7)) + ')'; break;
      case 'draw': el.style.strokeDashoffset = el.dataset.len * (1 - inOut(clamp(x / d))); break;
      case 'reveal': { const p = outExpo(clamp(x / d)); el.style.clipPath = 'inset(' + ((1 - p) * 100) + '% 0 0 0)'; break; }
      case 'kenburns': { const p = clamp(x / d); el.style.transform = 'scale(' + (1.16 - .12 * inOut(p)) + ') translateY(' + (-14 * p) + 'px)'; break; }
      case 'leak': { const p = clamp(x / d); el.style.transform = 'translateX(' + (-120 + 320 * inOut(p)) + '%)'; el.style.opacity = Math.sin(Math.PI * p); break; }
      case 'words': {
        el.querySelectorAll('.w').forEach((w, i) => {
          const p = clamp((x - i * .11) / .18);
          w.style.opacity = p; w.style.transform = 'scale(' + (1 + (1 - outExpo(p)) * .25) + ')';
        });
        break;
      }
      case 'twinkle': {
        const p = clamp(x / .5);
        el.style.opacity = x < 0 ? 0 : p * (.55 + .45 * Math.abs(Math.sin(t * 2.4 + t0 * 3)));
        el.style.transform = 'scale(' + (outBack(p) * (.85 + .25 * Math.abs(Math.sin(t * 2.4 + t0 * 3)))) + ') rotate(' + (t * 40 + t0 * 50) + 'deg)';
        break;
      }
      case 'ghost': { const p = outExpo(clamp(x / 1.4)); el.style.opacity = p * .07; el.style.transform = 'scale(' + (1.35 - .35 * p) + ')'; break; }
      case 'eyecatch': {
        const p = outExpo(clamp(x / .25));
        el.style.transform = 'scale(' + (1.25 - .25 * p) + ') translate(' + ((hash(t * 30) - .5) * 10) + 'px,' + ((hash(t * 31) - .5) * 10) + 'px)';
        break;
      }
      case 'stamp': {
        const p = clamp(x / .32);
        el.style.opacity = clamp(p * 4);
        el.style.transform = 'scale(' + (x < .32 ? 1.9 - .9 * outExpo(p) : 1) + ') rotate(' + (x < .32 ? -8 * (1 - p) : 0) + 'deg)';
        break;
      }
    }
  });

  // Golpe del sello: pequeño temblor de toda la pieza.
  let shake = 0;
  document.querySelectorAll('[data-anim="stamp"]').forEach(s => { const x = t - s.dataset.t; if (x > .3 && x < .5) shake = (1 - (x - .3) / .2) * 7; });

  // Corte con fallo de VHS.
  let g = 0;
  CORTES.forEach(c => { g = Math.max(g, 1 - Math.abs(t - c) / .2); });
  g = clamp(g);
  if (g > 0) {
    contenido.style.filter = 'url(#vhs)';
    document.getElementById('vhs-disp').setAttribute('scale', 90 * g);
    document.getElementById('vhs-turb').setAttribute('seed', Math.floor(t * 30) % 50);
    document.getElementById('vhs-r').setAttribute('dx', 16 * g);
    document.getElementById('vhs-c').setAttribute('dx', -16 * g);
  } else contenido.style.filter = 'none';
  document.getElementById('flash').style.opacity = g > .8 ? (g - .8) * .6 : 0;

  // Cámara: deriva suave + temblor del sello + sacudida del corte.
  const jx = (hash(t * 30) - .5) * 26 * g + (hash(t * 47) - .5) * shake;
  const jy = (hash(t * 33) - .5) * shake;
  contenido.style.transform = 'translate(' + (Math.sin(t * .7) * 4 + jx) + 'px,' + (Math.cos(t * .5) * 3 + jy) + 'px) scale(' + (1.012 + .008 * Math.sin(t * .4)) + ')';

  // Puntilla que se desliza, grano, banda de tracking, piloto REC.
  document.getElementById('encaje').style.transform = 'translateX(' + (-((t * 22) % 48)) + 'px)';
  document.querySelector('.grano-v').style.transform = 'translate(' + ((t * 997) % 40 - 20) + 'px,' + ((t * 613) % 40 - 20) + 'px)';
  document.getElementById('tracking').style.top = (((t * 520) % 2300) - 200) + 'px';
  document.querySelector('.rec-v .p').style.opacity = Math.floor(t * 2) % 2 ? .25 : 1;

  // Pétalos y polvo.
  document.querySelectorAll('.particula').forEach(p => {
    const [x0, y0, v, ph, rot] = p.dataset.p.split(',').map(Number);
    const y = ((y0 * 2100 + t * v) % 2100) - 100;
    const x = x0 * 1080 + Math.sin(t * .8 + ph) * 34;
    p.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + (rot * t + ph * 60) + 'deg)';
  });
};
`;
