// Efectos de sonido de los reels, sintetizados desde cero (sin muestras de terceros).
// Cada efecto acompaña a un gesto del motion graphics: play de VHS, cortes con fallo de cinta,
// soplido del telón, teclas de máquina, campanitas de los destellos, tic de los contadores,
// golpe del eyecatch, golpe del sello y stop de cinta.
//
// renderSfx(eventos, duracion) → WAV mono 44,1 kHz (Buffer), listo para mezclar con la música.

const SR = 44100;

// Ruido determinista para que cada reel suene igual al regenerarlo.
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
}

const lp = (x, fc) => { const a = 1 - Math.exp(-2 * Math.PI * fc / SR); let y = 0; return x.map(v => (y += a * (v - y))); };
const hp = (x, fc) => { const l = lp(x, fc); return x.map((v, i) => v - l[i]); };
const n = s => Math.max(1, Math.round(s * SR));

function seno(f, dur, decay = 6, fase = 0) {
  const out = new Float32Array(n(dur));
  for (let i = 0; i < out.length; i++) { const t = i / SR; out[i] = Math.sin(2 * Math.PI * f * t + fase) * Math.exp(-t * decay); }
  return out;
}

function ruido(dur, r) { const out = new Float32Array(n(dur)); for (let i = 0; i < out.length; i++) out[i] = r(); return out; }

function env(x, ataque, caida) {
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] *= Math.min(1, t / Math.max(ataque, 1e-4)) * Math.exp(-t * caida); }
  return x;
}

// ── Efectos ────────────────────────────────────────────────────────────────
const EFECTOS = {
  // Mecanismo del vídeo al dar play: golpe grave + motor.
  play(r) {
    const golpe = seno(95, .18, 22);
    const click = env(hp(ruido(.03, r), 2000), .001, 120);
    const motor = new Float32Array(n(.7));
    for (let i = 0; i < motor.length; i++) { const t = i / SR; motor[i] = (Math.sin(2 * Math.PI * 50 * t) + .5 * Math.sin(2 * Math.PI * 100 * t)) * .12 * Math.min(1, t / .05) * Math.max(0, 1 - t / .7); }
    return mezclar([[golpe, 0, .7], [click, 0, .5], [motor, .02, 1]]);
  },
  // Corte con fallo de cinta: ráfagas de ruido cortadas, chirrido que cae y zumbido.
  glitch(r) {
    const dur = .42, out = new Float32Array(n(dur));
    const base = lp(hp(ruido(dur, r), 700), 4500);
    let abierto = true, cambio = 0;
    for (let i = 0; i < out.length; i++) {
      if (i >= cambio) { abierto = r() > -.3; cambio = i + n(.025 + (r() + 1) * .03); }
      const t = i / SR, eSup = Math.sin(Math.PI * Math.min(1, t / dur));
      const crush = Math.round(base[i] * 6) / 6;
      out[i] = (abierto ? crush * .55 : 0) * eSup;
      out[i] += Math.sin(2 * Math.PI * (2600 * Math.exp(-t * 7) + 300) * t) * .07 * eSup;
      out[i] += Math.sin(2 * Math.PI * 60 * t) * .08 * eSup;
    }
    return out;
  },
  // Telón que sube: ruido con filtro que se abre.
  whoosh(r) {
    const dur = .85, x = ruido(dur, r), out = new Float32Array(x.length);
    let y = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, fc = 250 + 3800 * Math.pow(t / dur, 1.6), a = 1 - Math.exp(-2 * Math.PI * fc / SR);
      y += a * (x[i] - y);
      out[i] = y * Math.sin(Math.PI * t / dur) * .55;
    }
    return out;
  },
  // Tecla de máquina de escribir.
  tecla(r) {
    const clack = env(hp(ruido(.035, r), 1800), .0005, 160);
    const tono = seno(1700 + r() * 300, .02, 220);
    return mezclar([[clack, 0, .5], [tono, 0, .15]]);
  },
  // Destello: campanita aguda con un poco de vibrato.
  campana() {
    const a = seno(2637, .9, 5.5), b = seno(3951, .7, 7), c = seno(5274, .4, 11);
    return mezclar([[a, 0, .5], [b, .01, .3], [c, .02, .15]]);
  },
  // Brillo de un título: arpegio rápido ascendente.
  brillo() {
    const notas = [1568, 1976, 2349, 3136, 3951];
    return mezclar(notas.map((f, i) => [seno(f, .6, 8), i * .045, .22]));
  },
  // Tic de contador.
  tic(r) { return mezclar([[env(hp(ruido(.012, r), 3000), .0003, 300), 0, .5], [seno(3200, .01, 400), 0, .2]]); },
  // Eyecatch: golpe grave y campana.
  eyecatch() {
    const golpe = new Float32Array(n(.6));
    for (let i = 0; i < golpe.length; i++) { const t = i / SR; golpe[i] = Math.sin(2 * Math.PI * (40 + 60 * Math.exp(-t * 18)) * t) * Math.exp(-t * 6); }
    return mezclar([[golpe, 0, .9], [seno(1318, 1.2, 3.2), .02, .28], [seno(1975, 1, 4), .03, .16]]);
  },
  // Sello estampado: golpe seco y papel.
  sello(r) {
    const golpe = new Float32Array(n(.35));
    for (let i = 0; i < golpe.length; i++) { const t = i / SR; golpe[i] = Math.sin(2 * Math.PI * (55 + 90 * Math.exp(-t * 30)) * t) * Math.exp(-t * 14); }
    const papel = env(lp(ruido(.12, r), 1600), .001, 35);
    return mezclar([[golpe, 0, 1], [papel, 0, .6]]);
  },
  // Stop de cinta al final.
  stop(r) {
    const click = env(hp(ruido(.04, r), 1500), .001, 90);
    return mezclar([[seno(80, .2, 18), 0, .6], [click, .01, .45]]);
  },
};

function mezclar(capas) {
  const largo = Math.max(...capas.map(([x, off]) => x.length + n(off)));
  const out = new Float32Array(largo);
  for (const [x, off, vol] of capas) { const o = n(off); for (let i = 0; i < x.length; i++) out[o + i] += x[i] * vol; }
  return out;
}

// Reverberación corta (peines en paralelo) para que los efectos respiren en el mismo espacio.
function reverb(x, mezcla = .18) {
  const out = Float32Array.from(x);
  for (const [ms, g] of [[29.7, .72], [37.1, .7], [41.1, .68], [43.7, .66]]) {
    const d = n(ms / 1000), buf = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) buf[i] = x[i] + (i >= d ? buf[i - d] * g : 0);
    for (let i = 0; i < x.length; i++) out[i] += buf[i] * mezcla * .25;
  }
  return out;
}

const VOL = { play: .8, glitch: .95, whoosh: .5, tecla: .26, campana: .17, brillo: .13, tic: .12, eyecatch: .7, sello: .85, stop: .6 };

export function renderSfx(eventos, duracion) {
  const pista = new Float32Array(n(duracion + 1));
  const r = rng(20261206);
  for (const ev of eventos) {
    const sonido = EFECTOS[ev.tipo]?.(r);
    if (!sonido) continue;
    const o = n(Math.max(0, ev.t)), vol = (VOL[ev.tipo] ?? .3) * (ev.vol ?? 1);
    for (let i = 0; i < sonido.length && o + i < pista.length; i++) pista[o + i] += sonido[i] * vol;
  }
  const mezclado = reverb(pista).subarray(0, n(duracion));
  // WAV PCM 16 bits mono.
  const datos = Buffer.alloc(mezclado.length * 2);
  for (let i = 0; i < mezclado.length; i++) datos.writeInt16LE(Math.round(Math.max(-1, Math.min(1, Math.tanh(mezclado[i]))) * 32767), i * 2);
  const cab = Buffer.alloc(44);
  cab.write('RIFF', 0); cab.writeUInt32LE(36 + datos.length, 4); cab.write('WAVE', 8); cab.write('fmt ', 12);
  cab.writeUInt32LE(16, 16); cab.writeUInt16LE(1, 20); cab.writeUInt16LE(1, 22); cab.writeUInt32LE(SR, 24);
  cab.writeUInt32LE(SR * 2, 28); cab.writeUInt16LE(2, 32); cab.writeUInt16LE(16, 34); cab.write('data', 36); cab.writeUInt32LE(datos.length, 40);
  return Buffer.concat([cab, datos]);
}
