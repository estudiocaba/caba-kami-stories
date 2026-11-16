"""Compositor de lofi oscuro para los reels de @caba.kami.

Genera pistas originales (sin derechos de terceros) de 16 compases en cuatro secciones
(A, A', B, A'') para que no se note la repetición dentro de un reel:
piano eléctrico FM con acordes menores, bajo redondo, batería suave con swing,
colchón oscuro, melodía de caja de música, crujido de vinilo y cinta que ondula.
Todo pasa por un filtro paso bajo para el sonido apagado del lofi.

Uso:  python3 musica/componer.py            → genera las 4 pistas en musica/*.m4a
Requiere numpy, scipy y ffmpeg.
"""

import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
AQUI = Path(__file__).parent

NOTAS = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6,
         'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def hz(nota, octava):
    return 440.0 * 2 ** ((NOTAS[nota] + 12 * (octava + 1) - 69) / 12)


def midi_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env(n, a=0.01, d=0.3, s=0.6, r=0.4, largo=None):
    """Envolvente ADSR de n muestras (largo = muestras sostenidas antes del release)."""
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    largo = n - r if largo is None else largo
    e = np.zeros(n)
    k = 0
    for seg, val in ((a, None), (d, None)):
        pass
    t = np.arange(n)
    e = np.where(t < a, t / max(a, 1), 0.0)
    m = (t >= a) & (t < a + d)
    e[m] = 1 - (1 - s) * (t[m] - a) / max(d, 1)
    m = (t >= a + d) & (t < largo)
    e[m] = s
    m = t >= largo
    e[m] = s * np.maximum(0, 1 - (t[m] - largo) / max(r, 1))
    return e


def lowpass(x, fc, orden=2):
    return sosfilt(butter(orden, fc, 'low', fs=SR, output='sos'), x)


def highpass(x, fc, orden=2):
    return sosfilt(butter(orden, fc, 'high', fs=SR, output='sos'), x)


def bandpass(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)


def piano_fm(f, dur, vel=0.5):
    """Piano eléctrico tipo Rhodes: FM con índice que decae + leve desafinado."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    idx = 2.2 * np.exp(-t * 3.5) + 0.25
    voz = np.zeros(n)
    for det in (-0.6, 0.6):
        ff = f * 2 ** (det / 1200)
        voz += np.sin(2 * np.pi * ff * t + idx * np.sin(2 * np.pi * ff * t))
    voz += 0.15 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 6)  # "tine"
    return voz * env(n, a=0.004, d=1.2, s=0.35, r=0.5) * vel * 0.5


def bajo(f, dur, vel=0.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.2 * np.sin(2 * np.pi * 2 * f * t)
    x = np.tanh(1.6 * x)
    return x * env(n, a=0.008, d=0.25, s=0.7, r=0.15) * vel * 0.55


def pad(fs, dur, vel=0.18):
    """Colchón oscuro: sierras desafinadas muy filtradas."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for f in fs:
        for det in (-7, 0, 7):
            ff = f * 2 ** (det / 1200)
            x += 2 * ((ff * t) % 1) - 1
    x = lowpass(x / (3 * len(fs)), 900, 2)
    return x * env(n, a=0.8, d=0.5, s=0.9, r=1.0) * vel


def caja_musica(f, dur, vel=0.18):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2.01 * f * t) + 0.12 * np.sin(2 * np.pi * 3.98 * f * t)
    return x * np.exp(-t * 3.2) * vel


def bombo(vel=0.8):
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    fr = 48 + 70 * np.exp(-t * 28)
    fase = 2 * np.pi * np.cumsum(fr) / SR
    return np.sin(fase) * np.exp(-t * 9) * vel


def caja(rng, vel=0.35):
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    ruido = bandpass(rng.standard_normal(n), 900, 5000) * np.exp(-t * 18)
    tono = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 25)
    return (0.8 * ruido + 0.5 * tono) * vel


def charles(rng, vel=0.12, abierto=False):
    n = int((0.22 if abierto else 0.06) * SR)
    t = np.arange(n) / SR
    return highpass(rng.standard_normal(n), 7000) * np.exp(-t * (14 if abierto else 60)) * vel


def poner(pista, x, inicio):
    i = int(inicio * SR)
    if i >= len(pista):
        return
    x = x[: len(pista) - i]
    pista[i: i + len(x)] += x


def vinilo(n, rng):
    hiss = lowpass(rng.standard_normal(n), 6000) * 0.006
    clics = np.zeros(n)
    pos = rng.integers(0, n, size=int(n / SR * 9))
    clics[pos] = rng.uniform(-1, 1, size=len(pos)) * rng.uniform(0.05, 0.25, size=len(pos))
    clics = lowpass(clics, 3500)
    return hiss + clics


def wobble(x, prof=0.0025, vel=0.35):
    """Cinta que ondula: retardo variable (leve desafinado lento)."""
    n = len(x)
    t = np.arange(n)
    d = prof * SR * (1 + np.sin(2 * np.pi * vel * t / SR)) / 2
    idx = np.clip(t - d, 0, n - 1)
    i0 = np.floor(idx).astype(int)
    fr = idx - i0
    i1 = np.minimum(i0 + 1, n - 1)
    return x[i0] * (1 - fr) + x[i1] * fr


# Acordes: (raíz, octava, intervalos en semitonos)
M9 = [0, 3, 7, 10, 14]      # menor 9
MAJ7 = [0, 4, 7, 11]
M7 = [0, 3, 7, 10]
D7B9 = [0, 4, 10, 13]
SUS = [0, 5, 7, 10]

PISTAS = {
    'medianoche': dict(bpm=72, semilla=1, prog=[('D', 3, M9), ('A#', 2, MAJ7), ('G', 2, M9), ('A', 2, D7B9)], escala=[2, 5, 7, 9, 0]),
    'luna-roja': dict(bpm=68, semilla=2, prog=[('A', 2, M9), ('F', 2, MAJ7), ('D', 3, M7), ('E', 2, SUS)], escala=[9, 0, 2, 4, 7]),
    'niebla': dict(bpm=76, semilla=3, prog=[('E', 2, M9), ('C', 3, MAJ7), ('A', 2, M7), ('B', 2, D7B9)], escala=[4, 7, 9, 11, 2]),
    'vela': dict(bpm=70, semilla=4, prog=[('C', 3, M9), ('G#', 2, MAJ7), ('F', 2, M9), ('G', 2, SUS)], escala=[0, 3, 5, 7, 10]),
}


def componer(nombre, bpm, semilla, prog, escala, compases=16):
    rng = np.random.default_rng(semilla)
    pulso = 60 / bpm
    compas = 4 * pulso
    dur = compases * compas
    n = int(dur * SR) + SR
    piano = np.zeros(n); bajos = np.zeros(n); fondo = np.zeros(n); bat = np.zeros(n); mel = np.zeros(n)

    for c in range(compases):
        seccion = c // 4
        # B (compases 9-12): la progresión empieza por el tercer acorde, cambia el color armónico.
        raiz, octv, ints = prog[(c + (2 if seccion == 2 else 0)) % len(prog)]
        # A' y A'': el acorde se invierte (la nota grave sube una octava), mismo acorde, otra voz.
        if seccion in (1, 3):
            ints = ints[1:] + [ints[0] + 12]
        base = NOTAS[raiz] + 12 * (octv + 1)
        t0 = c * compas
        # Piano: acorde arpegiado suave en el 1 y un empuje en el "y" del 2.
        for k, it in enumerate(ints):
            f = midi_hz(base + 12 + it)
            poner(piano, piano_fm(f, compas * 0.95, 0.42 - 0.04 * k), t0 + 0.018 * k)
        empuje = 2.5 if seccion != 2 else 3.0
        for k, it in enumerate(ints[1:4]):
            poner(piano, piano_fm(midi_hz(base + 12 + it), pulso * 1.6, 0.22), t0 + empuje * pulso + 0.015 * k)
        # Bajo
        fb = midi_hz(base - 12 if base > 45 else base)
        poner(bajos, bajo(fb, pulso * 1.8), t0)
        poner(bajos, bajo(fb, pulso * 0.9, 0.45), t0 + 2.5 * pulso)
        poner(bajos, bajo(midi_hz(base - 12 + 7 if base > 45 else base + 7), pulso * 0.8, 0.4), t0 + 3.5 * pulso)
        # Colchón
        poner(fondo, pad([midi_hz(base + it) for it in ints[:3]], compas * 1.05), t0)
        # Batería con swing (desde el compás 2 para que la entrada respire)
        if c >= 1:
            sw = pulso * 0.5 * 0.16
            poner(bat, bombo(0.75), t0)
            poner(bat, bombo(0.5), t0 + 1.75 * pulso)
            relleno = c % 4 == 3
            if not relleno:
                poner(bat, bombo(0.6), t0 + 2.5 * pulso)
            poner(bat, caja(rng, 0.3), t0 + pulso)
            poner(bat, caja(rng, 0.32), t0 + 3 * pulso)
            if relleno:  # pequeño redoble al final de cada sección
                poner(bat, caja(rng, 0.18), t0 + 3.5 * pulso)
                poner(bat, caja(rng, 0.22), t0 + 3.75 * pulso)
            for h in range(8):
                poner(bat, charles(rng, 0.09 + 0.03 * (h % 2 == 0), abierto=(h == 7 and c % 2)), t0 + h * pulso / 2 + (sw if h % 2 else 0))
        # Caja de música: pocas notas de la escala, a partir del compás 3.
        if c >= 2:
            for paso in range(8):
                if rng.random() < (0.22, 0.3, 0.38, 0.32)[seccion]:
                    m = 72 + escala[rng.integers(0, len(escala))] + (12 if rng.random() < 0.2 else 0)
                    poner(mel, caja_musica(midi_hz(m), 1.6), t0 + paso * pulso / 2)

    piano = wobble(piano)
    mezcla = (0.9 * piano + 0.85 * bajos + 0.8 * fondo + 0.75 * bat + 0.7 * mel)
    # Bombeo suave del colchón y el piano con el pulso (sidechain casero)
    t = np.arange(n) / SR
    bombeo = 1 - 0.18 * np.exp(-((t % pulso) / 0.12))
    mezcla *= bombeo
    mezcla = lowpass(mezcla, 4200, 2) + 0.15 * lowpass(mezcla, 9000, 1)
    mezcla += vinilo(n, rng)
    mezcla = highpass(mezcla, 35, 2)
    mezcla = mezcla[: int(dur * SR)]
    # Fundido mínimo en las costuras del bucle.
    f = int(0.02 * SR)
    mezcla[:f] *= np.linspace(0, 1, f); mezcla[-f:] *= np.linspace(1, 0, f)
    mezcla = np.tanh(mezcla / (np.max(np.abs(mezcla)) + 1e-9) * 1.3) * 0.85
    estereo = np.stack([mezcla, wobble(mezcla, 0.0008, 0.21)], axis=1)
    pcm = (estereo * 32767).astype(np.int16).tobytes()
    salida = AQUI / f'{nombre}.m4a'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-c:a', 'aac', '-b:a', '160k', str(salida)], input=pcm, check=True)
    print(f'{salida.name}: {dur:.1f} s a {bpm} bpm')


if __name__ == '__main__':
    elegidas = sys.argv[1:] or list(PISTAS)
    for nombre in elegidas:
        componer(nombre, **PISTAS[nombre])
