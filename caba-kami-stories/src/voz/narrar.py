"""Voz en off de los reels del grimorio.

Uso:  python3 src/voz/narrar.py entrada.json carpeta_salida
  entrada.json: {"motor": "edge"|"azure"|"piper", "voz": "es-MX-DaliaNeural", "velocidad": "-4%",
                 "pronunciacion": {"cour": "cur"}, "textos": [{"clave": "intro", "texto": "..."}]}
Escribe <clave>.wav (44,1 kHz, mono, 16 bits) y voces.json con la duración de cada clip y su
volumen a 12 valores por segundo (para mover la boca de la bruja que habla).

Motores:
  azure  Voces neuronales de Microsoft por la vía oficial (Azure Speech, plan gratuito de
         500.000 caracteres al mes). Necesita AZURE_SPEECH_KEY y AZURE_SPEECH_REGION.
  edge   Las mismas voces por el servicio de lectura de Edge (gratis, no oficial). Para pruebas.
  piper  Daniela (es_AR), voz libre (dataset OpenSLR 61, CC BY-SA 4.0). Funciona sin ninguna cuenta.
  elevenlabs  Voces de ElevenLabs (modelo multilingüe). Necesita ELEVENLABS_API_KEY; "voz" es el
         voice_id de la voz elegida en su biblioteca. En el plan gratuito, solo uso no comercial y
         con atribución a ElevenLabs (el copy la añade solo); el plan Starter quita las dos cosas.
"""
import asyncio, json, os, re, subprocess, sys, urllib.request, wave
from pathlib import Path

import numpy as np

conf = json.loads(Path(sys.argv[1]).read_text())
OUT = Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
motor = conf.get('motor') or ('azure' if os.environ.get('AZURE_SPEECH_KEY') else 'edge')
voz = conf.get('voz', 'es-MX-DaliaNeural')
vel = conf.get('velocidad', '-4%')


def pronunciar(t):
    for palabra, como in (conf.get('pronunciacion') or {}).items():
        t = re.sub(rf'\b{re.escape(palabra)}\b', como, t, flags=re.I)
    return t


def a_wav(src, dst):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(src), '-af',
                    'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,'
                    'highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-16:TP=-1.5',
                    '-ar', '44100', '-ac', '1', '-c:a', 'pcm_s16le', str(dst)], check=True)


async def edge(texto, dst):
    import edge_tts
    await edge_tts.Communicate(texto, voz, rate=vel).save(str(dst) + '.mp3')
    a_wav(str(dst) + '.mp3', dst)


def azure(texto, dst):
    region, key = os.environ['AZURE_SPEECH_REGION'], os.environ['AZURE_SPEECH_KEY']
    lang = '-'.join(voz.split('-')[:2])
    ssml = (f"<speak version='1.0' xml:lang='{lang}'><voice name='{voz}'><prosody rate='{vel}'>"
            f"{texto.replace('&', 'y').replace('<', '').replace('>', '')}</prosody></voice></speak>")
    req = urllib.request.Request(f'https://{region}.tts.speech.microsoft.com/cognitiveservices/v1', data=ssml.encode(),
                                 headers={'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml',
                                          'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm', 'User-Agent': 'caba-kami'})
    Path(str(dst) + '.raw.wav').write_bytes(urllib.request.urlopen(req, timeout=60).read())
    a_wav(str(dst) + '.raw.wav', dst)


def piper(texto, dst):
    base = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high'
    if not Path('/tmp/daniela.onnx').exists():
        for ext in ('.onnx', '.onnx.json'):
            urllib.request.urlretrieve(base + ext, f'/tmp/daniela{ext}')
    subprocess.run(['python3', '-m', 'piper', '-m', '/tmp/daniela.onnx', '-f', str(dst) + '.raw.wav'], input=texto.encode(), check=True)
    a_wav(str(dst) + '.raw.wav', dst)


def elevenlabs(texto, dst):
    key = os.environ['ELEVENLABS_API_KEY']
    cuerpo = json.dumps({'text': texto, 'model_id': conf.get('modelo', 'eleven_multilingual_v2'),
                         'voice_settings': {'stability': conf.get('estabilidad', 0.45), 'similarity_boost': 0.8, 'style': conf.get('estilo', 0.25)}}).encode()
    req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{voz}?output_format=mp3_44100_128', data=cuerpo,
                                 headers={'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
    Path(str(dst) + '.mp3').write_bytes(urllib.request.urlopen(req, timeout=120).read())
    a_wav(str(dst) + '.mp3', dst)


def envolvente(dst):
    with wave.open(str(dst)) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
    paso = 44100 // 12
    env = [float(np.sqrt(np.mean(x[i:i + paso] ** 2))) for i in range(0, len(x), paso)]
    m = max(env) or 1
    return len(x) / 44100, [round(v / m, 3) for v in env]


salida = {}
for item in conf['textos']:
    clave, texto = item['clave'], pronunciar(item['texto'])
    dst = OUT / f'{clave}.wav'
    if motor == 'elevenlabs':
        elevenlabs(texto, dst)
    elif motor == 'azure':
        azure(texto, dst)
    elif motor == 'piper':
        piper(texto, dst)
    else:
        asyncio.run(edge(texto, dst))
    dur, env = envolvente(dst)
    salida[clave] = {'dur': round(dur, 3), 'env': env}
    print(f'  voz «{clave}»: {dur:.1f} s')
(OUT / 'voces.json').write_text(json.dumps({'motor': motor, 'voz': voz, 'clips': salida}))
