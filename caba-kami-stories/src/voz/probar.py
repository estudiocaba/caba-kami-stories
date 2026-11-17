"""Genera muestras de voces femeninas en español para elegir la narradora del grimorio.
Uso (en GitHub Actions): python3 src/voz/probar.py out/voces
"""
import asyncio, json, subprocess, sys, urllib.request
from pathlib import Path

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else 'out/voces')
OUT.mkdir(parents=True, exist_ok=True)
TEXTO = ("En Japón, la tele reparte el año en cuatro bloques de tres meses. Cada bloque es un cur. "
         "Así que no: tu anime no se cortó por capricho. Se cortó por calendario.")

def a_m4a(wav, nombre):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-af', 'highpass=f=70,loudnorm=I=-16:TP=-1.5',
                    '-c:a', 'aac', '-b:a', '128k', str(OUT / f'{nombre}.m4a')], check=True)

# 1) Piper · Daniela (es_AR), voz libre (dataset OpenSLR 61, CC BY-SA 4.0)
base = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high'
for ext in ('.onnx', '.onnx.json'):
    urllib.request.urlretrieve(base + ext, f'/tmp/daniela{ext}')
subprocess.run(['python3', '-m', 'piper', '-m', '/tmp/daniela.onnx', '-f', '/tmp/daniela.wav'], input=TEXTO.encode(), check=True)
a_m4a('/tmp/daniela.wav', '1-daniela-argentina-libre')

# 2) Voces neuronales de Microsoft (las mismas que Azure Speech)
import edge_tts
VOCES = [('es-MX-DaliaNeural', '2-dalia-mexico'), ('es-UY-ValentinaNeural', '3-valentina-uruguay'),
         ('es-AR-ElenaNeural', '4-elena-argentina'), ('es-CO-SalomeNeural', '5-salome-colombia'),
         ('es-ES-ElviraNeural', '6-elvira-espana'), ('es-US-PalomaNeural', '7-paloma-latina-neutra')]
async def edge():
    for voz, nombre in VOCES:
        await edge_tts.Communicate(TEXTO, voz, rate='-4%').save(f'/tmp/{nombre}.mp3')
        a_m4a(f'/tmp/{nombre}.mp3', nombre)
asyncio.run(edge())
print('\n'.join(sorted(p.name for p in OUT.iterdir())))
