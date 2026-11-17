// Estilo «editorial con fotos» para clientes (el de ZS Peluqueros): fotos a sangre, titulares en serif
// condensada y en mayúsculas, franjas con la cuenta y la web arriba y abajo, cajas negras con texto
// blanco, collages con huecos blancos, consejos sobre foto oscurecida y cierre «PIDE TU CITA».
// Sirve para carruseles (1080×1350) y stories (1080×1920). Colores y fuentes salen de marca.json.
//
// Tipos (carrusel y story):
//   portada   {foto, titulo: ["*TENDENCIA*", "COLOR *2026*"], etiqueta}   *…* = cursiva
//   fototexto {foto, texto}                       foto con caja negra de texto abajo
//   tira      {fotos: [..], nombres: [..], texto} franjas verticales de foto con nombre girado
//   duo       {fotos: [a, b], texto}              dos fotos en paralelo con caja de texto
//   collage   {fotos: [..5], titulo}              collage con huecos blancos y titular encima
//   tip       {foto, titulo, texto, consejo}      consejo sobre foto oscurecida
//   pregunta  {foto, pregunta, opciones}          (stories) pregunta sobre foto
//   cierre    {foto, pregunta}                    logo, pregunta y PIDE TU CITA

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const enf = s => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
const bg = src => (src ? `background-image:url('${src}')` : 'background:linear-gradient(160deg,#6b5546,#2a211c)');

export function cssEditorial(m, alto) {
  const c = m.colores, T = m.fuentes.titulo, X = m.fuentes.texto;
  const s = alto > 1500;   // story
  return `*{box-sizing:border-box;margin:0;padding:0}
body{background:#000}
.ed{width:1080px;height:${alto}px;position:relative;overflow:hidden;background:${c.fondo};color:#fff;font-family:'${X}',sans-serif}
.foto{position:absolute;background-size:cover;background-position:center}
.llena{inset:0}
.franja{position:absolute;left:48px;right:48px;display:flex;align-items:center;justify-content:space-between;z-index:5;
  font:600 ${s ? 22 : 17}px '${X}',sans-serif;letter-spacing:.04em;text-transform:uppercase;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.35)}
.franja i{flex:0 0 ${s ? 150 : 120}px;height:2px;background:rgba(255,255,255,.75);display:block}
.franja.arriba{top:${s ? 250 : 40}px}.franja.abajo{bottom:${s ? 330 : 40}px}
.serif{font-family:'${T}',serif;font-weight:400;text-transform:uppercase;line-height:.86;letter-spacing:-.01em}
.serif em{font-style:italic}
.caja{position:absolute;left:0;right:0;background:rgba(18,14,12,.93);color:#fff;font-size:${s ? 38 : 31}px;line-height:1.32;padding:36px 56px}
.caja p+p{margin-top:12px}
.sombra{position:absolute;inset:0;background:linear-gradient(to bottom, rgba(0,0,0,.28), rgba(0,0,0,0) 25%, rgba(0,0,0,0) 55%, rgba(0,0,0,.45))}
.oscuro{position:absolute;inset:0;background:rgba(20,16,14,.48)}
.centro{position:absolute;left:80px;right:80px;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:${s ? 40 : 30}px}
.tit-tip{font:800 ${s ? 68 : 54}px/1.08 '${X}',sans-serif;text-transform:uppercase;text-shadow:0 2px 12px rgba(0,0,0,.45)}
.txt{font-size:${s ? 42 : 32}px;line-height:1.35;text-shadow:0 2px 10px rgba(0,0,0,.5)}
.consejo{font-style:italic;font-size:${s ? 36 : 28}px;line-height:1.35;text-shadow:0 2px 10px rgba(0,0,0,.5);max-width:820px}
.nombre-v{position:absolute;top:24px;left:50%;transform-origin:left top;transform:rotate(-90deg) translate(-100%,-50%);font:600 ${s ? 22 : 18}px '${X}',sans-serif;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap;text-shadow:0 1px 6px rgba(0,0,0,.6)}
.opcion{border:2px solid rgba(255,255,255,.85);border-radius:999px;padding:22px 44px;font:600 ${s ? 40 : 30}px '${X}',sans-serif;background:rgba(0,0,0,.25)}
.pastilla{border:2px solid rgba(255,255,255,.7);border-radius:999px;padding:12px 34px;font:500 ${s ? 24 : 18}px '${X}',sans-serif;letter-spacing:.08em;text-transform:uppercase;opacity:.85}
.logo-txt{display:flex;flex-direction:column;align-items:center;gap:4px}
.logo-txt b{font:italic 900 ${s ? 170 : 130}px/0.9 '${X}',sans-serif;letter-spacing:-.06em;background:linear-gradient(170deg,#fff,#9a9a9a 55%,#e8e8e8);-webkit-background-clip:text;color:transparent}
.logo-txt span{text-transform:uppercase;font:700 ${s ? 26 : 20}px '${X}',sans-serif;letter-spacing:.06em}
.logo-txt small{font:300 ${s ? 26 : 20}px '${X}',sans-serif;letter-spacing:.12em}
`;
}

const franjas = m => `<div class="franja arriba"><span>${esc(m.handle)}</span><i></i><span>${esc(m.web ?? '')}</span></div>
  <div class="franja abajo"><span>${esc(m.handle)}</span><i></i><span>${esc(m.web ?? '')}</span></div>`;

function logo(m) {
  if (m.logo) return `<img src="${m.logo}" style="height:${m._story ? 260 : 200}px">`;
  const [a, ...b] = String(m.logoTexto ?? m.nombre).split('|');
  return `<div class="logo-txt"><b>${esc(m.sigla ?? a.slice(0, 2))}</b><span>${esc(a)}</span>${b.length ? `<small>${esc(b.join(' '))}</small>` : ''}</div>`;
}

function textoCaja(t) { return (Array.isArray(t) ? t : [t]).map(p => `<p>${enf(p)}</p>`).join(''); }

export const TIPOS = {
  portada: (d, m, H) => {
    const lineas = Array.isArray(d.titulo) ? d.titulo : [d.titulo];
    const largo = Math.max(...lineas.map(l => l.replace(/\*/g, '').length));
    const t = Math.min(H > 1500 ? 220 : 190, Math.round(980 / (0.42 * Math.max(6, largo))));
    return `<div class="foto llena" style="${bg(d.foto)}"></div><div class="sombra"></div>
    <div class="zona" style="position:absolute;left:56px;right:56px;top:${H > 1500 ? 560 : 300}px;bottom:${H > 1500 ? 420 : 110}px;display:flex;flex-direction:column;justify-content:space-between">
      <div class="serif" style="font-size:${t}px;text-shadow:0 4px 20px rgba(0,0,0,.25)">${lineas.map(l => `<div>${enf(l)}</div>`).join('')}</div>
      <div>${d.etiqueta ? `<div class="serif" style="font-size:${H > 1500 ? 120 : 100}px;border-top:2px solid rgba(255,255,255,.8);padding-top:20px">${enf(d.etiqueta)}</div>` : ''}
      ${d.bajada ? `<div class="txt" style="margin-top:24px">${enf(d.bajada)}</div>` : ''}</div>
    </div>`;
  },
  fototexto: (d, m, H) => `<div class="foto" style="left:0;right:0;top:0;bottom:${H > 1500 ? 560 : 330}px;${bg(d.foto)}"></div>
    <div class="zona caja" style="bottom:0;top:${H - (H > 1500 ? 560 : 330)}px;display:flex;flex-direction:column;justify-content:center;padding-bottom:${H > 1500 ? 380 : 90}px">${textoCaja(d.texto)}</div>`,
  tira: (d, m, H) => {
    const fs = d.fotos ?? [], n = Math.max(1, fs.length), alto = H > 1500 ? 1100 : 860, top = H > 1500 ? 300 : 90;
    return `<div style="position:absolute;left:0;right:0;top:${top}px;height:${alto}px;display:flex;gap:3px">${fs.map((f, i) =>
      `<div style="flex:1;position:relative"><div class="foto llena" style="${bg(f)}"></div><div class="nombre-v">${esc(d.nombres?.[i] ?? '')}</div></div>`).join('')}</div>
    <div class="zona caja" style="top:${top + alto}px;bottom:0;padding-bottom:${H > 1500 ? 380 : 90}px">${textoCaja(d.texto)}</div>`;
  },
  duo: (d, m, H) => {
    const alto = H > 1500 ? 1150 : 860, top = H > 1500 ? 300 : 0;
    return `<div style="position:absolute;left:0;right:0;top:${top}px;height:${alto}px;display:flex;gap:3px">${(d.fotos ?? []).slice(0, 2).map(f =>
      `<div style="flex:1;position:relative"><div class="foto llena" style="${bg(f)}"></div></div>`).join('')}</div>
    <div class="zona caja" style="top:${top + alto}px;bottom:0;padding-bottom:${H > 1500 ? 380 : 90}px">${textoCaja(d.texto)}</div>`;
  },
  collage: (d, m, H) => {
    const f = d.fotos ?? [], g = 8, top = H > 1500 ? 300 : 0, alto = H > 1500 ? 1290 : 1350;
    const fila1 = Math.round(alto * .33);
    return `<div style="position:absolute;left:0;right:0;top:${top}px;height:${alto}px;background:#f4f3f1;padding:${g}px;display:grid;
      grid-template-columns:1fr 1fr 1fr;grid-template-rows:${fila1}px 1fr 1fr;gap:${g}px">
      ${[0, 1, 2].map(i => `<div style="position:relative"><div class="foto llena" style="${bg(f[i])}"></div></div>`).join('')}
      <div style="position:relative;grid-column:1 / 3;grid-row:2 / 4"><div class="foto llena" style="${bg(f[3])}"></div>
        <div class="zona" style="position:absolute;left:32px;right:32px;bottom:${H > 1500 ? 40 : 60}px"><div class="serif" style="font-size:${H > 1500 ? 120 : 108}px;text-shadow:0 4px 18px rgba(0,0,0,.35)">${enf(d.titulo)}</div></div></div>
      <div style="position:relative;grid-column:3;grid-row:2"><div class="foto llena" style="${bg(f[4])}"></div></div>
      <div style="position:relative;grid-column:3;grid-row:3"><div class="foto llena" style="${bg(f[5] ?? f[0])}"></div></div>
    </div>`;
  },
  tip: (d, m, H) => `<div class="foto llena" style="${bg(d.foto)}"></div><div class="oscuro"></div>
    <div class="centro zona">${d.titulo ? `<div class="tit-tip">${enf(d.titulo)}</div>` : ''}${d.texto ? `<div class="txt">${enf(d.texto)}</div>` : ''}
      ${d.consejo ? `<div class="consejo">Nuestro consejo: ${enf(d.consejo)}</div>` : ''}
      ${d.fuente ? `<div class="consejo" style="font-style:normal;font-size:${H > 1500 ? 24 : 20}px;letter-spacing:.08em;text-transform:uppercase;opacity:.8">Fuente: ${esc(d.fuente)}</div>` : ''}</div>`,
  pregunta: (d, m, H) => `<div class="foto llena" style="${bg(d.foto)}"></div><div class="oscuro"></div>
    <div class="centro zona"><div class="serif" style="font-size:${H > 1500 ? 120 : 96}px;line-height:.95">${enf(d.pregunta)}</div>
      ${(d.opciones ?? []).map(o => `<div class="opcion">${enf(o)}</div>`).join('')}
      <div class="consejo" style="font-style:normal;font-size:${H > 1500 ? 30 : 24}px;opacity:.85">${enf(d.pie ?? 'Respóndenos por mensaje')}</div></div>`,
  cierre: (d, m, H) => `<div class="foto llena" style="${bg(d.foto)};filter:blur(6px);transform:scale(1.06)"></div><div class="oscuro" style="background:rgba(36,26,20,.62)"></div>
    <div class="centro zona" style="gap:${H > 1500 ? 56 : 40}px">${logo({ ...m, _story: H > 1500 })}
      <div class="serif" style="font-size:${H > 1500 ? 76 : 60}px;line-height:1"><em>${enf(d.pregunta ?? '')}</em></div>
      <div class="serif" style="font-size:${H > 1500 ? 150 : 120}px;font-weight:300">${esc(m.ctaCorta ?? 'Pide tu cita')}</div>
      ${m.ctaDetalle ? `<div class="consejo" style="font-style:normal;font-size:${H > 1500 ? 32 : 26}px">${enf(m.ctaDetalle)}</div>` : ''}
      <div class="pastilla">${esc(m.handle)}</div></div>`,
};

export function seccionEditorial(d, m, H, conFranjas = true) {
  const f = TIPOS[d.tipo];
  if (!f) throw new Error(`Tipo desconocido en el estilo editorial: ${d.tipo}. Hay: ${Object.keys(TIPOS).join(', ')}`);
  return `${f(d, m, H)}${conFranjas && d.tipo !== 'cierre' ? franjas(m) : ''}`;
}
