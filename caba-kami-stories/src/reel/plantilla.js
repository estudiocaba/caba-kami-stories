// Plantilla de reel «Lista» de @caba.kami: vídeo vertical 1080×1920 de unos 15 segundos.
// Intro con título → una escena por elemento (foto en arco ojival, nombre, dato y subtítulo
// estilo fansub) → cierre con pregunta y sello. Misma identidad que los carruseles.
//
// La animación no usa CSS en tiempo real: cada elemento lleva data-in / data-out (segundos)
// y window.render(t) coloca el fotograma exacto, para grabarlo fotograma a fotograma.

import { CSS, FONTS, puntilla, destellos, arco, arcoFoto } from '../carrusel/plantilla.js';

const REEL_CSS = `
body{margin:0;background:#000;}
.reel{width:1080px;height:1920px;position:relative;overflow:hidden;background:var(--noche);color:var(--luna);}
.esc{position:absolute;inset:0;opacity:0;}
.anim{opacity:0;will-change:transform,opacity;}
.lineas{position:absolute;inset:0;pointer-events:none;z-index:20;opacity:.07;background:repeating-linear-gradient(to bottom, rgba(236,235,238,.5) 0 1px, transparent 1px 4px);}
.grano-v{position:absolute;inset:-40px;pointer-events:none;z-index:21;opacity:.09;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");}
.fansub{position:absolute;left:90px;right:90px;text-align:center;font-family:var(--texto);font-weight:700;font-size:46px;line-height:1.35;color:var(--luna);
  text-shadow:-3px -3px 0 var(--noche),3px -3px 0 var(--noche),-3px 3px 0 var(--noche),3px 3px 0 var(--noche),0 0 18px rgba(14,13,15,.9);}
.titulo-v{font-family:var(--display);font-style:italic;font-weight:600;line-height:.95;text-shadow:-2px 0 0 rgba(184,48,77,.55),2px 0 0 rgba(201,199,203,.35);}
.rec-v{position:absolute;left:72px;top:250px;font-family:var(--dato);font-size:26px;letter-spacing:.14em;color:var(--niebla);display:flex;gap:18px;align-items:center;z-index:5;}
.rec-v .p{width:18px;height:18px;border-radius:50%;background:var(--vino-vivo);}
`;

// Script del fotograma: opacidad con fundido, subida suave al entrar y zoom lento en las fotos.
const RENDER_JS = `
const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
window.render = t => {
  document.querySelectorAll('[data-in]').forEach(el => {
    const a = +el.dataset.in, b = +el.dataset.out, f = +(el.dataset.fade || .45);
    const o = Math.min(ease((t - a) / f), ease((b - t) / f));
    el.style.opacity = o;
    if (el.classList.contains('anim')) el.style.transform = 'translateY(' + ((1 - ease((t - a) / f)) * 40) + 'px)';
    if (el.dataset.zoom) el.style.transform = 'scale(' + (1.03 + .07 * Math.max(0, Math.min(1, (t - a) / (b - a)))) + ')';
  });
  document.querySelectorAll('.parpadeo').forEach((el, i) => {
    el.style.opacity = .45 + .55 * Math.abs(Math.sin(t * 2.2 + i * 1.7));
  });
  const g = document.querySelector('.grano-v');
  if (g) g.style.transform = 'translate(' + ((t * 997) % 40 - 20) + 'px,' + ((t * 613) % 40 - 20) + 'px)';
  const rec = document.querySelector('.rec-v .p');
  if (rec) rec.style.opacity = Math.floor(t * 2) % 2 ? .25 : 1;
};
`;

export function duracionLista(spec) {
  return (spec.intro ?? 2.6) + spec.items.length * (spec.porElemento ?? 3.6) + (spec.outro ?? 3);
}

export function buildReelLista(spec, imgs) {
  const intro = spec.intro ?? 2.6, por = spec.porElemento ?? 3.6, outro = spec.outro ?? 3;
  const total = duracionLista(spec);
  const esc = (a, b, html, extra = '') => `<div class="esc" data-in="${a}" data-out="${b}" data-fade=".35" ${extra}>${html}</div>`;

  const introHtml = esc(0, intro + .2, `
    <div style="position:absolute;left:0;right:0;top:620px;text-align:center">
      <div class="anim" data-in=".15" data-out="${intro + .2}" style="font-family:var(--dato);font-size:30px;letter-spacing:.2em;color:var(--plata)">${spec.etiqueta ?? ''}</div>
      <div class="anim titulo-v" data-in=".35" data-out="${intro + .2}" style="font-size:150px;margin-top:40px">${spec.titulo.join('<br>')}</div>
      <div class="anim" data-in=".7" data-out="${intro + .2}" style="font-family:var(--display);font-style:italic;font-weight:500;font-size:60px;color:var(--plata);margin-top:36px">${spec.subtitulo ?? ''}</div>
    </div>
    <div class="parpadeo">${destellos([[180, 560, 44], [900, 640, 30], [210, 1180, 22], [880, 1240, 40]])}</div>`);

  const itemsHtml = spec.items.map((it, i) => {
    const a = intro + i * por, b = a + por + .2;
    return esc(a, b, `
      <div class="anim" data-in="${a + .1}" data-out="${b}" style="position:absolute;left:0;right:0;top:330px;text-align:center;font-family:var(--dato);font-size:32px;letter-spacing:.22em;color:var(--plata)">
        <span style="color:var(--vino-vivo)">${String(i + 1).padStart(2, '0')}</span> · ${it.etiqueta}</div>
      <div style="position:absolute;left:210px;top:410px;width:660px;height:820px">
        ${arco(0, 0, 660, 820, `<div data-in="${a}" data-out="${b}" data-zoom="1" style="position:absolute;inset:0">${arcoFoto(imgs[i])}</div>`)}
      </div>
      <div class="parpadeo">${destellos([[190, 520, 40], [890, 700, 26], [200, 1120, 18]])}</div>
      <div class="anim titulo-v" data-in="${a + .35}" data-out="${b}" style="position:absolute;left:60px;right:60px;top:1270px;text-align:center;font-size:${it.nombre.length > 16 ? 80 : 104}px">${it.nombre}</div>
      <div class="anim" data-in="${a + .55}" data-out="${b}" style="position:absolute;left:0;right:0;top:${it.nombre.length > 16 ? 1380 : 1400}px;text-align:center;font-family:var(--dato);font-weight:500;font-size:34px;letter-spacing:.12em;color:var(--luna)">${it.dato ?? ''}</div>
      <div class="fansub anim" data-in="${a + .9}" data-out="${b}" style="top:1490px">${it.subtitulo ?? ''}</div>`);
  }).join('');

  const a = intro + spec.items.length * por;
  const outroHtml = esc(a, total + 1, `
    <svg width="900" height="1150" style="position:absolute;left:90px;top:380px;overflow:visible" class="anim" data-in="${a + .05}" data-out="${total + 1}"><path d="M0,1150 L0,476.3 A675,675 0 0 1 450,0 A675,675 0 0 1 900,476.3 L900,1150" style="fill:none;stroke:var(--plata);stroke-width:3"/></svg>
    <div style="position:absolute;left:120px;right:120px;top:840px;text-align:center">
      <div class="anim titulo-v" data-in="${a + .25}" data-out="${total + 1}" style="font-size:120px">${spec.cierre.pregunta.join('<br>')}</div>
      <div class="anim" data-in="${a + .6}" data-out="${total + 1}" style="font-family:var(--dato);font-size:32px;letter-spacing:.18em;color:var(--plata);margin-top:60px">${spec.cierre.cta}</div>
    </div>
    <div class="anim" data-in="${a + .8}" data-out="${total + 1}" style="position:absolute;left:0;right:0;top:1420px;display:flex;justify-content:center;align-items:center;gap:28px">
      <div style="font-family:var(--display);font-style:italic;font-weight:600;font-size:72px">caba<span style="color:var(--vino-vivo)">.</span>kami</div>
      <div style="width:110px;height:110px;background:var(--vino);border-radius:6px;display:grid;place-items:center;box-shadow:inset 0 0 0 4px var(--vino),inset 0 0 0 6px var(--plata)"><span style="font-family:var(--kanji);font-weight:700;font-size:68px;line-height:1">神</span></div>
    </div>
    <div class="parpadeo">${destellos([[150, 820, 34], [930, 1000, 26], [170, 1300, 20]])}</div>`);

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
${FONTS.map(f => `<link rel="stylesheet" href="${f}">`).join('\n')}
<style>${CSS}${REEL_CSS}</style></head><body>
<div class="reel">
  <div style="position:absolute;left:0;right:0;top:0;transform:scale(1.4);transform-origin:top left;width:772px">${puntilla(.35)}</div>
  <div class="rec-v"><span class="p"></span>▶ PLAY&nbsp;&nbsp;@CABA.KAMI</div>
  ${introHtml}${itemsHtml}${outroHtml}
  <div class="lineas"></div><div class="grano-v"></div>
</div>
<script>${RENDER_JS}</script></body></html>`;
}
