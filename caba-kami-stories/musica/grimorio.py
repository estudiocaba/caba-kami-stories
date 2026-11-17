"""Música del grimorio: vals oscuro de bruja para los reels explicativos de @caba.kami.

Distinta del lofi de los reels de lista a propósito: compás de 3/4, clavecín (cuerda pulsada
con Karplus-Strong), celesta, bordón grave de cuerda, pandero en el primer tiempo y
golpecitos de madera en el segundo y el tercero. Escala menor armónica, que suena a cuento.

32 compases en cuatro partes (A, A', B, A'') para que dure un minuto sin repetirse.
Pensada para ir por debajo de una voz en off: pocas notas en la franja de la voz.

Uso:  python3 musica/grimorio.py            → genera caldero.m4a y hechizo.m4a
Requiere numpy, scipy y ffmpeg. Música original: sin derechos de terceros.
"""

import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
AQUI = Path(__file__).parent


def midi_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lp(x, fc, o=2):
    return sosfilt(butter(o, fc, 'low', fs=SR, output='sos'), x)


def hp(x, fc, o=2):
    return sosfilt(butter(o, fc, 'high', fs=SR, output='sos'), x)


def poner(pista, x, t):
    i = int(t * SR)
    if i >= len(pista):
        return
    x = x[: len(pista) - i]
    pista[i:i + len(x)] += x


def cuerda(f, dur, rng, brillo=0.5, decae=0.996):
    """Cuerda pulsada (Karplus-Strong) calculada por bloques de un periodo."""
    n = int(dur * SR)
    p = max(2, int(round(SR / f)))
    y = np.zeros(n + p + 1)
    ruido = rng.uniform(-1, 1, p)
    y[:p] = lp(ruido, 2000 + 6000 * brillo, 1)
    k = p
    while k < n + p:
        fin = min(k + p, n + p)
        a = y[k - p:fin - p]
        b = y[k - p - 1:fin - p - 1] if k - p - 1 >= 0 else np.concatenate(([0], y[k - p:fin - p - 1]))
        y[k:fin] = decae * 0.5 * (a + b)
        k = fin
    x = y[:n]
    x *= np.minimum(1, (n - np.arange(n)) / (0.05 * SR))
    return x


def clavecin(f, dur, rng, vel=0.3):
    x = cuerda(f, dur, rng, 0.9, 0.9965) + 0.45 * cuerda(f * 2, dur, rng, 1.0, 0.994)
    return hp(x, 180) * vel


def celesta(f, dur, vel=0.18):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.28 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 9) + 0.1 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t * 5)
    return x * np.exp(-t * 2.6) * np.minimum(1, t / 0.003) * vel


def bordon(fs, dur, vel=0.08):
    """Bordón de cuerda grave: sierras con vibrato lento, muy filtradas."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for f in fs:
        vib = 1 + 0.003 * np.sin(2 * np.pi * 4.8 * t)
        fase = 2 * np.pi * np.cumsum(f * vib) / SR
        x += 2 * ((fase / (2 * np.pi)) % 1) - 1
    x = lp(x / len(fs), 520, 2)
    env = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.8)
    return x * env * vel


def pandero(rng, vel=0.5):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    tono = np.sin(2 * np.pi * (70 + 40 * np.exp(-t * 30)) * t) * np.exp(-t * 7)
    piel = lp(rng.standard_normal(n), 1200) * np.exp(-t * 20) * 0.3
    return (tono + piel) * vel


def madera(rng, vel=0.08):
    n = int(0.08 * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 1100 * t) * np.exp(-t * 70) + hp(rng.standard_normal(n), 3000) * np.exp(-t * 90) * 0.4
    return x * vel


ARM = [0, 2, 3, 5, 7, 8, 11]  # menor armónica

PISTAS = {
    # tonalidad (midi de la tónica), tempo, progresiones A y B como (grado en semitonos, tipo)
    'caldero': dict(tonica=50, bpm=96, semilla=11,
                    A=[(0, 'm'), (5, 'm'), (7, '7'), (0, 'm'), (8, 'M'), (5, 'm'), (7, '7'), (0, 'm')],
                    B=[(8, 'M'), (3, 'M'), (5, 'm'), (7, '7'), (8, 'M'), (10, 'M'), (7, '7'), (7, '7')]),
    'hechizo': dict(tonica=45, bpm=88, semilla=23,
                    A=[(0, 'm'), (8, 'M'), (5, 'm'), (7, '7'), (0, 'm'), (3, 'M'), (7, '7'), (0, 'm')],
                    B=[(5, 'm'), (0, 'm'), (8, 'M'), (7, '7'), (5, 'm'), (0, 'm'), (2, 'd'), (7, '7')]),
}
TIPOS = {'m': [0, 3, 7], 'M': [0, 4, 7], '7': [0, 4, 7, 10], 'd': [0, 3, 6]}


def componer(nombre, tonica, bpm, semilla, A, B):
    rng = np.random.default_rng(semilla)
    pulso = 60 / bpm
    compas = 3 * pulso
    secciones = [A, A, B, A]
    total = sum(len(s) for s in secciones)
    dur = total * compas
    n = int(dur * SR) + SR * 2
    clav, cel, bor, perc = (np.zeros(n) for _ in range(4))

    # Motivo de melodía de dos compases (seis notas de la escala), que se varía en cada parte.
    motivo = [int(rng.integers(0, 7)) for _ in range(6)]
    c = 0
    for s, prog in enumerate(secciones):
        for k, (grado, tipo) in enumerate(prog):
            t0 = c * compas
            raiz = tonica + grado
            notas = [raiz + i for i in TIPOS[tipo]]
            # Vals: bajo en el 1, acorde en el 2 y el 3 (clavecín).
            poner(clav, clavecin(midi_hz(raiz - 12), compas, rng, 0.34), t0)
            for b in (1, 2):
                for j, m in enumerate(notas):
                    poner(clav, clavecin(midi_hz(m + 12), pulso * 1.2, rng, 0.11 if s != 2 else 0.09), t0 + b * pulso + 0.008 * j)
            # Bordón grave cada dos compases.
            if k % 2 == 0:
                poner(bor, bordon([midi_hz(raiz - 12), midi_hz(raiz - 5)], compas * 2.1), t0)
            # Percusión: pandero desde la parte A', madera siempre.
            if s >= 1:
                poner(perc, pandero(rng, 0.42 if k % 4 else 0.55), t0)
            for b in (1, 2):
                poner(perc, madera(rng, 0.06 + 0.02 * (b == 1)), t0 + b * pulso)
            # Celesta: el motivo desde A', más notas en B, eco una octava arriba en A''.
            if s >= 1:
                for b in range(3):
                    paso = motivo[(k % 2) * 3 + b] + (s == 2) * 2 + (k // 2) % 2
                    if s == 1 and b == 2 and rng.random() < .5:
                        continue
                    m = tonica + 12 + ARM[paso % 7] + 12 * (paso // 7)
                    # que la melodía caiga sobre notas del acorde en el primer tiempo
                    if b == 0:
                        m = min(notas, key=lambda q: abs((q + 24) - m)) + 24
                    poner(cel, celesta(midi_hz(m), pulso * 2.4, 0.16), t0 + b * pulso)
                    if s == 3:
                        poner(cel, celesta(midi_hz(m + 12), pulso * 2, 0.05), t0 + b * pulso + pulso / 2)
            c += 1

    mezcla = 0.95 * clav + 0.85 * cel + 1.0 * bor + 0.8 * perc
    # Sala pequeña de piedra: unas reflexiones cortas.
    sala = np.zeros_like(mezcla)
    for ms, g in ((23, .32), (37, .26), (53, .2), (71, .15), (97, .1)):
        d = int(ms / 1000 * SR)
        sala[d:] += mezcla[:-d] * g
    mezcla = mezcla + lp(sala, 3500)
    mezcla = hp(mezcla, 40)[: int(dur * SR)]
    f = int(0.03 * SR)
    mezcla[:f] *= np.linspace(0, 1, f)
    mezcla[-int(1.5 * SR):] *= np.linspace(1, 0, int(1.5 * SR))
    mezcla = np.tanh(mezcla / (np.max(np.abs(mezcla)) + 1e-9) * 1.2) * 0.85
    est = np.stack([mezcla, np.roll(mezcla, int(0.006 * SR))], axis=1)
    pcm = (est * 32767).astype(np.int16).tobytes()
    salida = AQUI / f'{nombre}.m4a'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-c:a', 'aac', '-b:a', '160k', str(salida)], input=pcm, check=True)
    print(f'{salida.name}: {dur:.1f} s a {bpm} bpm (3/4)')


if __name__ == '__main__':
    for nombre in sys.argv[1:] or list(PISTAS):
        componer(nombre, **PISTAS[nombre])
