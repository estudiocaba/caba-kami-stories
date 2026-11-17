"""Voz en off de los reels del grimorio.

Uso:  python3 src/voz/narrar.py entrada.json carpeta_salida
  entrada.json: {"motor": "edge"|"azure"|"piper"|"elevenlabs", "voz": "es-MX-DaliaNeural",
                 "velocidad": "+10%", "tono": "+5Hz", "pronunciacion": {"cour": "cur"},
                 "textos": [{"clave": "intro", "texto": "..."}]}
Escribe <clave>.wav (44,1 kHz, mono, 16 bits) y voces.json con, para cada clip: duración, volumen a
12 valores por segundo (boca de la bruja) y el momento de cada palabra (subtítulos).

La voz no se recorta al principio, para que los tiempos de cada palabra sigan valiendo.

Motores:
  gemini Voces de Google Gemini (TTS con indicaciones de estilo: suenan naturales y se les puede pedir
         entusiasmo). GEMINI_API_KEY (gratis en Google AI Studio); "voz" es el nombre (Laomedeia, Zephyr…)
         y "estilo_gemini" cómo decirlo. Modelo por defecto: gemini-3.1-flash-tts-preview (tiene plan gratuito).
  elevenlabs  Voces de ElevenLabs (modelo multilingüe), las más expresivas. ELEVENLABS_API_KEY; "voz"
         es el voice_id. Plan gratuito: uso no comercial y con atribución (el copy la añade sola).
  azure  Voces neuronales de Microsoft por la vía oficial (plan gratuito de 500.000 caracteres al
         mes). AZURE_SPEECH_KEY y AZURE_SPEECH_REGION.
  edge   Las mismas voces de Microsoft por el servicio de lectura de Edge (gratis, no oficial).
  piper  Daniela (es_AR), voz libre (dataset OpenSLR 61, CC BY-SA 4.0). Sin cuenta.

Pronunciación: "pronunciacion" cambia palabras solo en el audio. Sirve para tildes de apoyo
("abran" → "ábran") y palabras japonesas ("cour" → "cur"). Los subtítulos usan el texto original.
"""
import asyncio, base64, json, os, re, subprocess, sys, urllib.request, wave
from pathlib import Path

import numpy as np

conf = json.loads(Path(sys.argv[1]).read_text())
OUT = Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
motor = conf.get('motor') or ('azure' if os.environ.get('AZURE_SPEECH_KEY') else 'edge')
voz = conf.get('voz', 'es-MX-DaliaNeural')
vel = conf.get('velocidad', '+0%')
tono = conf.get('tono', '+0Hz')

# Ayudas de pronunciación que valen para cualquier ficha: imperativos y palabras que los motores
# suelen acentuar mal. La ficha puede añadir las suyas.
PRONUNCIACION = {'abran': 'ábran', 'miren': 'míren', 'lean': 'léan'}


def pronunciar(t):
    for palabra, como in {**PRONUNCIACION, **(conf.get('pronunciacion') or {})}.items():
        t = re.sub(rf'(?<![\wáéíóúñ]){re.escape(palabra)}(?![\wáéíóúñ])', como, t, flags=re.I)
    return t


def a_wav(src, dst):
    # Solo se quita el silencio del final (al principio no, para no mover los tiempos de las palabras).
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(src), '-af',
                    'areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,'
                    'highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-15:TP=-1.5',
                    '-ar', '44100', '-ac', '1', '-c:a', 'pcm_s16le', str(dst)], check=True)


async def edge(texto, dst):
    import edge_tts
    try:
        c = edge_tts.Communicate(texto, voz, rate=vel, pitch=tono, boundary='WordBoundary')
    except TypeError:
        c = edge_tts.Communicate(texto, voz, rate=vel, pitch=tono)
    audio, palabras = b'', []
    async for ch in c.stream():
        if ch['type'] == 'audio':
            audio += ch['data']
        elif ch['type'] == 'WordBoundary':
            palabras.append({'w': ch['text'], 't': ch['offset'] / 1e7, 'd': ch['duration'] / 1e7})
    Path(str(dst) + '.mp3').write_bytes(audio)
    a_wav(str(dst) + '.mp3', dst)
    return palabras


def azure(texto, dst):
    region, key = os.environ['AZURE_SPEECH_REGION'], os.environ['AZURE_SPEECH_KEY']
    lang = '-'.join(voz.split('-')[:2])
    estilo = conf.get('estilo_azure')
    cuerpo = f"<prosody rate='{vel}' pitch='{tono}'>{texto.replace('&', 'y').replace('<', '').replace('>', '')}</prosody>"
    if estilo:
        cuerpo = f"<mstts:express-as style='{estilo}'>{cuerpo}</mstts:express-as>"
    ssml = (f"<speak version='1.0' xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='{lang}'><voice name='{voz}'>{cuerpo}</voice></speak>")
    req = urllib.request.Request(f'https://{region}.tts.speech.microsoft.com/cognitiveservices/v1', data=ssml.encode(),
                                 headers={'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml',
                                          'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm', 'User-Agent': 'caba-kami'})
    Path(str(dst) + '.raw.wav').write_bytes(urllib.request.urlopen(req, timeout=60).read())
    a_wav(str(dst) + '.raw.wav', dst)
    return []


def elevenlabs(texto, dst):
    key = os.environ['ELEVENLABS_API_KEY']
    cuerpo = json.dumps({'text': texto, 'model_id': conf.get('modelo', 'eleven_multilingual_v2'),
                         'voice_settings': {'stability': conf.get('estabilidad', 0.35), 'similarity_boost': 0.8,
                                            'style': conf.get('estilo', 0.45), 'use_speaker_boost': True}}).encode()
    req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{voz}/with-timestamps?output_format=mp3_44100_128',
                                 data=cuerpo, headers={'xi-api-key': key, 'Content-Type': 'application/json'})
    r = json.loads(urllib.request.urlopen(req, timeout=120).read())
    Path(str(dst) + '.mp3').write_bytes(base64.b64decode(r['audio_base64']))
    a_wav(str(dst) + '.mp3', dst)
    al = r.get('alignment') or {}
    palabras, actual, ini, fin = [], '', None, 0
    for ch, t0, t1 in zip(al.get('characters', []), al.get('character_start_times_seconds', []), al.get('character_end_times_seconds', [])):
        if ch.isspace():
            if actual:
                palabras.append({'w': actual, 't': ini, 'd': fin - ini}); actual = ''
            continue
        if not actual:
            ini = t0
        actual += ch; fin = t1
    if actual:
        palabras.append({'w': actual, 't': ini, 'd': fin - ini})
    return palabras


ESTILO_GEMINI = ('Read this aloud in natural Latin American Spanish, like an excited anime fan telling a friend '
                 'something juicy on TikTok: upbeat, warm, playful, fast-paced but clear, with real enthusiasm and '
                 'natural pauses. Stress Spanish words correctly. Text')


def gemini(texto, dst):
    key = os.environ['GEMINI_API_KEY']
    modelo = conf.get('modelo', 'gemini-3.1-flash-tts-preview')
    estilo = conf.get('estilo_gemini', ESTILO_GEMINI)
    cuerpo = json.dumps({'contents': [{'role': 'user', 'parts': [{'text': f'{estilo}: {texto}'}]}],
                         'generationConfig': {'responseModalities': ['AUDIO'],
                                              'speechConfig': {'voiceConfig': {'prebuiltVoiceConfig': {'voiceName': voz}}}}}).encode()
    req = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent', data=cuerpo,
                                 headers={'x-goog-api-key': key, 'Content-Type': 'application/json'})
    r = json.loads(urllib.request.urlopen(req, timeout=180).read())
    datos = base64.b64decode(r['candidates'][0]['content']['parts'][0]['inlineData']['data'])
    crudo = Path(str(dst) + '.raw.wav')
    if datos[:4] == b'RIFF':
        crudo.write_bytes(datos)
    else:   # PCM de 16 bits, 24 kHz, mono, sin cabecera
        with wave.open(str(crudo), 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(datos)
    a_wav(crudo, dst)
    return []


def piper(texto, dst):
    base = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high'
    if not Path('/tmp/daniela.onnx').exists():
        for ext in ('.onnx', '.onnx.json'):
            urllib.request.urlretrieve(base + ext, f'/tmp/daniela{ext}')
    subprocess.run(['python3', '-m', 'piper', '-m', '/tmp/daniela.onnx', '--length-scale', '0.9', '-f', str(dst) + '.raw.wav'],
                   input=texto.encode(), check=True)
    a_wav(str(dst) + '.raw.wav', dst)
    return []


def envolvente(dst):
    with wave.open(str(dst)) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
    paso = 44100 // 12
    env = [float(np.sqrt(np.mean(x[i:i + paso] ** 2))) for i in range(0, len(x), paso)]
    m = max(env) or 1
    return len(x) / 44100, [round(v / m, 3) for v in env], x


def tiempos_aproximados(texto, x, dur):
    """Sin tiempos del motor: reparte las palabras sobre el tramo con voz, según su largo."""
    paso = 441
    e = np.array([np.sqrt(np.mean(x[i:i + paso] ** 2)) for i in range(0, len(x), paso)])
    voz_on = e > (e.max() * .08)
    ini = np.argmax(voz_on) * paso / 44100 if voz_on.any() else 0
    fin = (len(voz_on) - np.argmax(voz_on[::-1])) * paso / 44100 if voz_on.any() else dur
    ws = texto.split()
    pesos = np.array([len(w) + 2 for w in ws], float)
    pos = ini + np.concatenate(([0], np.cumsum(pesos)[:-1])) / pesos.sum() * (fin - ini)
    return [{'w': w, 't': float(p), 'd': float(q / pesos.sum() * (fin - ini))} for w, p, q in zip(ws, pos, pesos)]


def a_texto_original(original, palabras_tts):
    """Los subtítulos muestran el texto original: cada palabra toma el tiempo de su par en el audio."""
    ws = original.split()
    if not palabras_tts:
        return []
    n, m = len(ws), len(palabras_tts)
    par = lambda i: palabras_tts[min(m - 1, round(i * m / n))]
    return [{'w': w, 't': round(par(i)['t'], 3), 'd': round(par(i)['d'], 3)} for i, w in enumerate(ws)]


salida = {}
for item in conf['textos']:
    clave, original = item['clave'], item['texto']
    texto = pronunciar(original)
    dst = OUT / f'{clave}.wav'
    if motor == 'gemini':
        palabras = gemini(texto, dst)
    elif motor == 'elevenlabs':
        palabras = elevenlabs(texto, dst)
    elif motor == 'azure':
        palabras = azure(texto, dst)
    elif motor == 'piper':
        palabras = piper(texto, dst)
    else:
        palabras = asyncio.run(edge(texto, dst))
    dur, env, x = envolvente(dst)
    if not palabras:
        palabras = tiempos_aproximados(texto, x, dur)
    salida[clave] = {'dur': round(dur, 3), 'env': env, 'palabras': a_texto_original(original, palabras)}
    print(f'  voz «{clave}»: {dur:.1f} s, {len(palabras)} palabras con tiempo')
(OUT / 'voces.json').write_text(json.dumps({'motor': motor, 'voz': voz, 'clips': salida}, ensure_ascii=False))
