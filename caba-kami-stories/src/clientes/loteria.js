// Estilo «loteria» (Lotería El Pescador, Arguineguín): rojo #c00102 y blanco, Montserrat en negrita
// alternando con normal. En los textos: **negrita** y _normal_ (lo demás va según la plantilla).
//
// Tipos de diapositiva (1080×1350):
//   sorteo   {etiqueta, juego, titulo, nombre, fondo, decimo, delante}  post del sorteo extraordinario: foto de fondo,
//            el décimo sin fondo encima y, delante del décimo, el recorte del fondo (delante) para el efecto de capas
//   portada  {logoJuego, titulo, llamada, persona, cabecera, texto}      portada de carrusel con la foto de la trabajadora
//   info     {logoJuego, icono, puntos: [..], destacado}               diapositiva interior, toda roja
//   cierre   {titulo, texto}                                           cierre con la llamada a jugar por WhatsApp
//
// Logos oficiales (Loterías y Apuestas del Estado, Lotería Nacional, Euromillones…): no se dibujan. Van como archivos en
// clientes/<cuenta>/logos/ y se nombran en la ficha (logoJuego: "logos/loteria-nacional.png"). Si no existe el archivo,
// el hueco queda vacío.

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/_(.+?)_/g, '<span class="n">$1</span>').replace(/\n/g, '<br>');
// tamaño del título para que la línea más larga quepa (Montserrat 800 en mayúsculas ≈ 0,74 em por letra)
const tamTitulo = (t, ancho) => Math.min(84, Math.floor(ancho / (0.74 * Math.max(...lineas(t).map(l => l.replace(/[*_]/g, '').length), 6))));
const lineas = t => (Array.isArray(t) ? t : [t]).filter(Boolean);

export function cssLoteria(m) {
  const R = m.colores.acento ?? '#c00102';
  return `*{box-sizing:border-box;margin:0;padding:0}
body{background:#000}
.lt{width:1080px;height:1350px;position:relative;overflow:hidden;background:#fff;color:${R};font-family:'Montserrat',sans-serif;font-weight:700}
.lt b{font-weight:800}.lt .n{font-weight:400}
.capa{position:absolute;inset:0;background-size:cover;background-position:center}
.rojo{background:${R};color:#fff}
.logo-cliente{position:absolute;width:190px;height:190px;background-size:contain;background-repeat:no-repeat;background-position:center}
.pie{position:absolute;left:0;right:0;bottom:0;height:118px;display:flex;align-items:center;justify-content:center;gap:18px;font:800 30px 'Montserrat',sans-serif;letter-spacing:.01em;text-transform:uppercase}
.pie.blanco{background:#fff;color:${R}}
.lugar{font:800 27px 'Montserrat',sans-serif;letter-spacing:.02em;text-transform:uppercase}
.mayus{text-transform:uppercase}
.oficial{height:84px;background-size:contain;background-repeat:no-repeat;background-position:left center}
.burbuja{width:40px;height:40px;flex:0 0 40px}
`;
}

// Icono genérico de mensaje (no es el logo de WhatsApp; si existe logos/whatsapp.png se usa ese archivo).
const burbuja = (color, src) => src
  ? `<span class="burbuja" style="background:url('${src}') center/contain no-repeat"></span>`
  : `<svg class="burbuja" viewBox="0 0 40 40"><path d="M20 4C11 4 4 10.6 4 18.8c0 4.4 2 8.3 5.3 11L8 36l6.6-3.3c1.7.5 3.5.8 5.4.8 9 0 16-6.6 16-14.7S29 4 20 4z" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"/></svg>`;

const pieWhatsapp = (m, src) => `<div class="pie blanco">${burbuja(m.colores.acento, src)}<span>${esc(m.ctaCorta ?? 'Juega por WhatsApp')} al ${esc(m.whatsapp)}</span></div>`;

export const TIPOS = {
  sorteo: (d, m, src) => `
    <div class="capa" style="bottom:470px;${d.fondo ? `background-image:url('${src(d.fondo)}')` : 'background:#ddd'}"></div>
    ${d.decimo ? `<img src="${src(d.decimo)}" style="position:absolute;left:${d.decimoX ?? 150}px;top:${d.decimoY ?? 120}px;width:${d.decimoAncho ?? 780}px;transform:rotate(${d.giro ?? -3}deg);filter:drop-shadow(0 18px 30px rgba(0,0,0,.35))">` : ''}
    ${d.delante ? `<div class="capa" style="bottom:470px;background-image:url('${src(d.delante)}')"></div>` : ''}
    ${d.etiqueta !== false ? `<div class="rojo mayus" style="position:absolute;left:0;top:64px;padding:18px 40px 18px 44px;font-size:56px;font-weight:800">${fmt(d.etiqueta ?? '¡Ya disponible!')}</div>` : ''}
    <div class="rojo" style="position:absolute;left:0;right:0;bottom:0;height:540px;clip-path:polygon(0 70px,100% 0,100% 100%,0 100%);padding:150px 64px 0">
      ${d.logoJuego ? `<div class="oficial" style="width:90px;background-image:url('${src(d.logoJuego)}');margin-bottom:12px"></div>` : ''}
      <div class="mayus" style="font-size:28px;font-weight:800;letter-spacing:.02em">${fmt(d.juego ?? 'Lotería Nacional')}</div>
      <div style="font-size:50px;font-weight:400;margin-top:18px">${fmt(d.titulo ?? 'Sorteo Extraordinario')}</div>
      <div class="mayus" style="font-size:56px;font-weight:800;line-height:1.05;margin-top:6px;max-width:820px">${fmt(d.nombre)}</div>
      <div class="lugar" style="position:absolute;left:64px;bottom:60px">${esc(m.lugar)}</div>
      <div class="logo-cliente" style="right:50px;bottom:110px;background-image:url('${m.logo}')"></div>
    </div>`,

  portada: (d, m, src) => `
    ${d.logoJuego ? `<div class="oficial" style="position:absolute;left:64px;top:56px;width:300px;background-image:url('${src(d.logoJuego)}')"></div>` : ''}
    <div class="mayus" style="position:absolute;left:64px;top:${d.logoJuego ? 170 : 90}px;width:${d.persona ? 560 : 950}px;font-size:${d.tamTitulo ?? tamTitulo(d.titulo, d.persona ? 560 : 950)}px;line-height:1.02;font-weight:800">${lineas(d.titulo).map(fmt).join('<br>')}</div>
    ${d.persona ? `<img src="${src(d.persona)}" style="position:absolute;right:0;bottom:560px;height:${d.alturaPersona ?? 700}px">` : ''}
    ${d.flecha !== false && d.persona ? `<svg style="position:absolute;left:330px;top:560px" width="160" height="70" viewBox="0 0 160 70"><path d="M6 14 C 40 64, 110 66, 150 34" fill="none" stroke="${m.colores.acento}" stroke-width="4" stroke-linecap="round"/><path d="M128 26 L152 32 L140 54" fill="none" stroke="${m.colores.acento}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}
    <div class="mayus" style="position:absolute;left:64px;bottom:610px;width:560px;font-size:40px;line-height:1.08;font-weight:800">${fmt(d.llamada ?? '')}</div>
    <div class="rojo" style="position:absolute;left:0;right:0;bottom:0;height:560px;padding:60px 64px 0">
      <div class="mayus" style="font-size:58px;font-weight:800;line-height:1.05">${fmt(d.cabecera ?? '')}</div>
      <div class="mayus" style="font-size:32px;font-weight:700;line-height:1.35;margin-top:36px;max-width:700px">${fmt(d.texto ?? '')}</div>
      <div class="lugar" style="position:absolute;left:64px;bottom:60px">${esc(m.lugar)}</div>
      <div class="logo-cliente" style="right:50px;bottom:60px;width:170px;height:170px;background-image:url('${m.logo}')"></div>
    </div>`,

  info: (d, m, src) => `
    <div class="capa rojo"></div>
    <div class="logo-cliente" style="right:56px;top:50px;width:110px;height:110px;background-image:url('${m.logo}')"></div>
    ${d.logoJuego ? `<div style="position:absolute;left:0;right:0;top:${d.icono ? 70 : 110}px;height:300px;background:url('${src(d.logoJuego)}') center/contain no-repeat"></div>`
      : d.titulo ? `<div class="mayus" style="position:absolute;left:96px;right:200px;top:150px;font-size:76px;line-height:1.02;font-weight:800">${lineas(d.titulo).map(fmt).join('<br>')}</div>` : ''}
    <div style="position:absolute;left:96px;right:96px;top:${d.logoJuego || d.titulo ? 470 : 200}px;font-size:36px;line-height:1.55;font-weight:400;color:#fff">
      ${(d.puntos ?? []).map(p => `<div style="display:flex;gap:18px"><span>•</span><span>${fmt(p)}</span></div>`).join('')}
    </div>
    ${d.destacado ? `<div class="mayus" style="position:absolute;right:0;top:${d.altoDestacado ?? 810}px;background:#fff;color:${m.colores.acento};border-radius:36px 0 0 36px;padding:28px 64px 28px 70px;font-size:48px;line-height:1.08;font-weight:800;text-align:right;max-width:860px">${lineas(d.destacado).map(fmt).join('<br>')}</div>` : ''}
    ${pieWhatsapp(m, src(m.iconoWhatsapp))}`,

  cierre: (d, m) => `
    <div class="capa rojo" style="bottom:118px"></div>
    <div class="logo-cliente" style="left:50%;top:80px;width:360px;height:360px;transform:translateX(-50%);background-image:url('${m.logo}')"></div>
    <div style="position:absolute;left:80px;right:80px;top:500px;text-align:center;color:#fff">
      <div class="mayus" style="font-size:66px;line-height:1.05;font-weight:800">${lineas(d.titulo ?? [`Escríbenos por WhatsApp`, `al ${m.whatsapp}`]).map(fmt).join('<br>')}</div>
      ${d.texto !== false ? `<div style="font-size:31px;line-height:1.45;font-weight:600;margin-top:40px">${fmt(d.texto ?? m.textoApp ?? '')}</div>` : ''}
    </div>
    <div class="pie blanco"><span>${esc(m.lugar)}</span></div>`,
};

export function seccionLoteria(d, m, src) {
  const f = TIPOS[d.tipo];
  if (!f) throw new Error(`Tipo desconocido en el estilo loteria: ${d.tipo}. Hay: ${Object.keys(TIPOS).join(', ')}`);
  return f(d, m, ref => (ref ? src(ref) : ''));
}
