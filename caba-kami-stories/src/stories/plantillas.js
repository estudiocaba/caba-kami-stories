// Plantillas de stories diarias (1080×1920) para cualquier cliente del Aquelarre.
// Cada cliente tiene su marca en clientes/<cuenta>/marca.json (colores, fuentes, logo, esquinas)
// y las mismas plantillas se visten con ella. Ver clientes/README.md.
//
// Zonas seguras de Instagram: arriba quedan 250 px para la barra de progreso y el nombre de la cuenta,
// abajo 340 px para la caja de respuesta. El contenido vive entre esas dos franjas, con márgenes de 96 px.

import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

// Fuente: si está instalada con @fontsource se usa en local; si no, se pide a Google Fonts.
export function fuenteCss(nombre, pesos = [400, 600, 700]) {
  const slug = nombre.toLowerCase().replace(/\s+/g, '-');
  try {
    const dir = path.dirname(require.resolve(`@fontsource/${slug}/package.json`));
    return pesos.flatMap(p => [`${p}.css`, `${p}-italic.css`]).filter(f => existsSync(path.join(dir, f)))
      .map(f => pathToFileURL(path.join(dir, f)).href);
  } catch {
    return [`https://fonts.googleapis.com/css2?family=${encodeURIComponent(nombre)}:ital,wght@0,${pesos.join(';0,')};1,400&display=swap`];
  }
}

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// *palabra* → énfasis con el color de acento (igual que en los carruseles)
const enf = s => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');

function css(m) {
  const c = m.colores, r = m.esquinas ?? 0;
  return `
*{box-sizing:border-box;margin:0;padding:0}
body{background:#000}
.story{width:1080px;height:1920px;position:relative;overflow:hidden;background:${c.fondo};color:${c.texto};
  font-family:'${m.fuentes.texto}',sans-serif;}
.zona{position:absolute;left:96px;right:96px;top:250px;bottom:340px;display:flex;flex-direction:column;}
.marca{position:absolute;left:96px;right:96px;bottom:250px;display:flex;justify-content:space-between;align-items:center;
  font-size:30px;letter-spacing:.06em;color:${c.suave};}
.marca img{height:64px;}
.marca .nombre{font-family:'${m.fuentes.titulo}',serif;font-size:40px;color:${c.texto};letter-spacing:0;}
.etiqueta{display:inline-block;align-self:flex-start;font-size:30px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;
  color:${c.fondo};background:${c.acento};padding:14px 24px 12px;border-radius:${Math.min(r, 40)}px;}
.titulo{font-family:'${m.fuentes.titulo}',serif;font-weight:${m.pesoTitulo ?? 600};line-height:1.02;letter-spacing:-.01em;}
.titulo em,.texto em{font-style:italic;color:${c.acento};}
.texto{font-size:46px;line-height:1.3;}
.suave{color:${c.suave};}
.linea{height:3px;background:${c.linea};}
.caja{border:3px solid ${c.linea};border-radius:${r}px;}
.foto{position:relative;background-size:cover;background-position:center;border-radius:${r}px;background-color:${c.linea};}
.llena{position:absolute;inset:0;border-radius:0;}
.fondo-acento{background:${c.acento};color:${c.fondo};}
.fondo-acento .titulo em{color:${c.texto};}
`;
}

const marcaPie = m => `<div class="marca">${m.logo ? `<img src="${m.logo}">` : `<span class="nombre">${esc(m.nombre)}</span>`}<span>${esc(m.handle)}</span></div>`;

const P = {
  // Frase, consejo o idea del día
  frase: (d, m) => `<div class="zona" style="justify-content:center;gap:56px">
    <span class="etiqueta">${esc(d.etiqueta ?? 'Consejo del día')}</span>
    <div class="titulo" style="font-size:${tam(d.texto, 118, 76)}px">${enf(d.texto)}</div>
    ${d.firma ? `<div class="linea" style="width:160px"></div><div class="texto suave">${enf(d.firma)}</div>` : ''}
  </div>`,

  // Un dato grande con su fuente
  dato: (d, m) => `<div class="zona" style="justify-content:center;gap:40px">
    <span class="etiqueta">${esc(d.etiqueta ?? 'Dato')}</span>
    <div class="titulo" style="font-size:${String(d.cifra).length > 4 ? 220 : 320}px;color:${m.colores.acento};line-height:.9">${esc(d.cifra)}<span style="font-size:.32em;color:${m.colores.texto}"> ${esc(d.unidad ?? '')}</span></div>
    <div class="texto" style="font-size:54px">${enf(d.texto)}</div>
    ${d.fuente ? `<div class="suave" style="font-size:28px;letter-spacing:.08em">FUENTE: ${esc(d.fuente).toUpperCase()}</div>` : ''}
  </div>`,

  // Pregunta para que respondan (la API de Instagram no pone encuestas: se invita a contestar por mensaje)
  pregunta: (d, m) => `<div class="zona" style="justify-content:center;gap:56px">
    <span class="etiqueta">${esc(d.etiqueta ?? 'Pregunta')}</span>
    <div class="titulo" style="font-size:${tam(d.pregunta, 112, 80)}px">${enf(d.pregunta)}</div>
    <div style="display:flex;flex-direction:column;gap:28px">${(d.opciones ?? []).map((o, i) =>
      `<div class="caja texto" style="padding:34px 40px;display:flex;gap:28px;align-items:center"><b style="color:${m.colores.acento};font-size:56px">${'ABCD'[i]}</b>${enf(o)}</div>`).join('')}</div>
    <div class="texto suave" style="font-size:36px">${enf(d.pie ?? 'Respóndenos por mensaje 👇')}</div>
  </div>`,

  // Promoción u oferta
  promo: (d, m) => `<div class="zona fondo-acento caja" style="justify-content:space-between;padding:80px 72px;border:none">
    <span class="etiqueta" style="background:${m.colores.fondo};color:${m.colores.acento}">${esc(d.etiqueta ?? 'Solo esta semana')}</span>
    <div>
      <div class="titulo" style="font-size:${tam(d.titulo, 130, 88)}px">${enf(d.titulo)}</div>
      ${d.precio ? `<div class="titulo" style="font-size:200px;margin-top:40px">${esc(d.precio)}</div>` : ''}
      ${d.detalle ? `<div class="texto" style="margin-top:36px">${enf(d.detalle)}</div>` : ''}
    </div>
    <div style="display:flex;flex-direction:column;gap:20px">
      ${d.cta ? `<div class="texto" style="font-weight:700;background:${m.colores.fondo};color:${m.colores.texto};padding:30px 40px;border-radius:${m.esquinas ?? 0}px;text-align:center">${enf(d.cta)}</div>` : ''}
      ${d.valido ? `<div style="font-size:28px;letter-spacing:.06em;text-align:center">${esc(d.valido)}</div>` : ''}
    </div>
  </div>`,

  // Foto del cliente con texto
  foto: (d, m) => `<div class="foto llena" data-foto="${esc(d.foto)}"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(to bottom, transparent 40%, ${m.colores.fondo}ee 78%)"></div>
    <div class="zona" style="justify-content:flex-end;gap:32px">
      ${d.etiqueta ? `<span class="etiqueta">${esc(d.etiqueta)}</span>` : ''}
      <div class="titulo" style="font-size:${tam(d.texto, 96, 70)}px">${enf(d.texto)}</div>
    </div>`,

  // Antes y después (peluquería, estética, reformas…)
  antesdespues: (d, m) => `<div class="zona" style="gap:36px">
    <span class="etiqueta">${esc(d.etiqueta ?? 'Antes y después')}</span>
    <div style="flex:1;display:grid;grid-template-rows:1fr 1fr;gap:20px">
      ${['antes', 'despues'].map(k => `<div class="foto" data-foto="${esc(d[k])}">
        <span class="etiqueta" style="position:absolute;left:24px;bottom:24px;font-size:26px">${k === 'antes' ? 'Antes' : 'Después'}</span></div>`).join('')}
    </div>
    ${d.texto ? `<div class="texto" style="font-size:42px">${enf(d.texto)}</div>` : ''}
  </div>`,

  // Agenda o plan del día (horarios, citas libres, evento)
  agenda: (d, m) => `<div class="zona" style="justify-content:center;gap:48px">
    <span class="etiqueta">${esc(d.etiqueta ?? 'Hoy')}</span>
    <div class="titulo" style="font-size:${tam(d.titulo, 120, 84)}px">${enf(d.titulo)}</div>
    <div>${(d.items ?? []).map(it => `<div style="display:flex;gap:40px;padding:30px 0;border-top:3px solid ${m.colores.linea};align-items:baseline">
      <span class="titulo" style="font-size:60px;color:${m.colores.acento};min-width:200px">${esc(it.hora)}</span><span class="texto">${enf(it.texto)}</span></div>`).join('')}</div>
    ${d.pie ? `<div class="texto suave" style="font-size:36px">${enf(d.pie)}</div>` : ''}
  </div>`,

  // Cuenta atrás hasta un evento
  cuentaatras: (d, m) => {
    const dias = d.dias ?? Math.max(0, Math.round((new Date(d.hasta) - new Date(d._fecha)) / 864e5));
    return `<div class="zona" style="justify-content:center;align-items:center;text-align:center;gap:24px">
      <span class="etiqueta" style="align-self:center">${esc(d.etiqueta ?? 'Cuenta atrás')}</span>
      <div class="titulo" style="font-size:420px;color:${m.colores.acento};line-height:.9;margin-top:40px">${dias}</div>
      <div class="titulo" style="font-size:72px">${dias === 1 ? 'día' : 'días'}</div>
      <div class="texto" style="margin-top:40px">${enf(d.texto)}</div>
    </div>`;
  },
};

// Tamaño de letra según el largo del texto: de grande (pocas letras) a pequeño (muchas)
function tam(texto = '', max, min) {
  const n = String(texto).length;
  return Math.round(n <= 40 ? max : n >= 140 ? min : max - (max - min) * (n - 40) / 100);
}

export const PLANTILLAS = Object.keys(P);

export function htmlStory(story, marca) {
  const f = P[story.plantilla];
  if (!f) throw new Error(`Plantilla de story desconocida: ${story.plantilla}. Hay: ${PLANTILLAS.join(', ')}`);
  const fuentes = [...new Set([marca.fuentes.titulo, marca.fuentes.texto])].flatMap(n => fuenteCss(n));
  const pie = story.plantilla === 'foto' ? '' : marcaPie(marca);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
${fuentes.map(u => `<link rel="stylesheet" href="${u}">`).join('\n')}
<style>${css(marca)}</style></head><body>
<div class="story">${f({ ...story, _fecha: story.fecha }, marca)}${pie}</div>
</body></html>`;
}

// Fotos: ruta relativa a la carpeta del cliente o URL. Se incrustan para que Chrome no dependa de la red.
export function resolverFotos(html, dirCliente) {
  return html.replace(/data-foto="([^"]*)"/g, (_, ref) => {
    if (!ref) return '';
    let src = ref;
    const local = path.resolve(dirCliente, ref);
    if (!/^https?:/.test(ref) && existsSync(local)) {
      const ext = path.extname(local).slice(1).toLowerCase().replace('jpg', 'jpeg');
      src = `data:image/${ext};base64,${readFileSync(local).toString('base64')}`;
    }
    return `style="background-image:url('${src}')"`;
  });
}
