"""Música propia y luminosa para las stories de clientes (peluquerías, estética, comercios).

Pop suave a 112 pulsos por minuto: bombo a negras, palmas en 2 y 4, charles a contratiempo, acordes
de séptima con un pad cálido y un punteo de piano eléctrico. Todo sintetizado aquí: es obra propia,
sin licencias de terceros (ver LICENCIAS.md).

Uso: python3 musica/luminosa.py   → escribe brillo.m4a, seda.m4a y verano.m4a (32 compases, ~68 s)
"""
import subprocess
import numpy as np
from pathlib import Path

SR = 44100
DIR = Path(__file__).parent
rng = np.random.default_rng(7)

def nota(m):
    return 440 * 2 ** ((m - 69) / 12)

def env(n, a=.005, r=.2):
    t = np.arange(n) / SR
    e = np.minimum(1, t / a) * np.exp(-t / r)
    return e

def seno(f, n, fase=0):
    return np.sin(2 * np.pi * f * np.arange(n) / SR + fase)

def bombo(n):
    t = np.arange(n) / SR
    f = 50 + 90 * np.exp(-t * 35)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)

def palmas(n):
    t = np.arange(n) / SR
    ruido = rng.standard_normal(n)
    e = sum(np.exp(-np.maximum(0, t - d) * 40) * (t >= d) for d in (0, .008, .017))
    return np.convolve(ruido, [1, -.9], 'same') * e * .5

def charles(n):
    t = np.arange(n) / SR
    r = rng.standard_normal(n)
    r = r - np.convolve(r, np.ones(4) / 4, 'same')
    return r * np.exp(-t * 60) * .35

def epiano(f, n):
    t = np.arange(n) / SR
    mod = np.sin(2 * np.pi * f * 2 * t) * 1.4 * np.exp(-t * 6)
    return np.sin(2 * np.pi * f * t + mod) * env(n, .003, .45)

def pad(fs, n):
    x = sum(sum(np.sin(2 * np.pi * f * d * np.arange(n) / SR + rng.random() * 6) for d in (1, 1.004, .996)) for f in fs)
    a = np.minimum(1, np.arange(n) / (SR * .25)) * np.minimum(1, (n - np.arange(n)) / (SR * .3))
    return x * a / (3 * len(fs))

def componer(nombre, tonica, progresion, bpm=112, compases=32):
    b = 60 / bpm
    n_comp = int(4 * b * SR)
    total = np.zeros(n_comp * compases + SR)
    for c in range(compases):
        o = c * n_comp
        grado = progresion[c % len(progresion)]
        acorde = [tonica + grado[0] + i for i in grado[1]]
        # pad y bajo
        total[o:o + n_comp] += pad([nota(m) for m in acorde], n_comp) * .22
        bajo = nota(tonica + grado[0] - 24)
        for k in range(4):
            s = o + int(k * b * SR); m = int(b * SR * .9)
            total[s:s + m] += seno(bajo, m) * env(m, .01, .35) * .32
        seccion = (c // 8) % 4
        for k in range(4):
            s = o + int(k * b * SR)
            if seccion > 0 or c % 8 >= 4:
                total[s:s + int(.4 * SR)] += bombo(int(.4 * SR)) * .55
            if k in (1, 3) and seccion > 0:
                total[s:s + int(.25 * SR)] += palmas(int(.25 * SR)) * .3
            h = s + int(b * SR / 2)
            total[h:h + int(.08 * SR)] += charles(int(.08 * SR)) * (.5 if seccion > 0 else .25)
        # punteo: arpegio de corcheas sobre el acorde
        if seccion in (1, 3):
            for k in range(8):
                s = o + int(k * b / 2 * SR); m = int(b * SR)
                mn = acorde[(k * 2 + c) % len(acorde)] + 12
                if (k + c) % 3 != 2:
                    total[s:s + m] += epiano(nota(mn), m) * .16
    total = total[: n_comp * compases]
    # mezcla: compresión suave y fundido final
    total = np.tanh(total * 1.3) * .8
    total[-SR * 2:] *= np.linspace(1, 0, SR * 2)
    wav = DIR / f'{nombre}.wav'
    import wave
    with wave.open(str(wav), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(total, -1, 1) * 32767).astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-ac', '2', '-c:a', 'aac', '-b:a', '160k', str(DIR / f'{nombre}.m4a')], check=True)
    wav.unlink()
    print(f'{nombre}.m4a')

MAJ7, MIN7, DOM = [0, 4, 7, 11], [0, 3, 7, 10], [0, 4, 7, 10]
componer('brillo', 60, [(0, MAJ7), (9, MIN7), (5, MAJ7), (7, DOM)])          # Do: I - vi - IV - V
componer('seda', 62, [(0, MIN7), (5, MAJ7), (10, MAJ7), (3, MAJ7)], bpm=104)  # Re menor, más suave
componer('verano', 65, [(0, MAJ7), (7, DOM), (9, MIN7), (5, MAJ7)], bpm=118)  # Fa, más animada
