"""Genera muestras de narradora para el grimorio, con el mismo código que usan los reels (narrar.py).
Uso (en GitHub Actions): python3 src/voz/probar.py out/voces

Siempre: voces de Microsoft (sin cuenta), incluidas las «multilingües», que suenan más conversacionales.
Con GEMINI_API_KEY: voces de Google Gemini a las que se les pide entusiasmo.
Con ELEVENLABS_API_KEY y ELEVENLABS_VOCES ("nombre=voice_id,nombre=voice_id"): voces de ElevenLabs.
"""
import json, os, subprocess, sys
from pathlib import Path

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else 'out/voces')
OUT.mkdir(parents=True, exist_ok=True)
TEXTO = ("¿Tu anime se cortó en el capítulo 12, justo en lo mejor? No es mala suerte. Tiene nombre: cour. "
         "Un episodio por semana durante tres meses: salen 12 o 13. Por eso tantos animes mueren en el capítulo 12.")
NARRAR = Path(__file__).with_name('narrar.py')

MUESTRAS = [
    ('edge', 'es-MX-DaliaNeural', '01-dalia-mexico-actual', {}),
    ('edge', 'en-US-AvaMultilingualNeural', '02-ava-multilingue', {}),
    ('edge', 'en-US-EmmaMultilingualNeural', '03-emma-multilingue', {}),
    ('edge', 'es-US-PalomaNeural', '04-paloma-latina', {}),
]
if os.environ.get('GEMINI_API_KEY'):
    for n, v in enumerate(['Laomedeia', 'Zephyr', 'Autonoe', 'Leda', 'Aoede'], 5):
        MUESTRAS.append(('gemini', v, f'{n:02d}-gemini-{v.lower()}', {}))
for n, par in enumerate(filter(None, os.environ.get('ELEVENLABS_VOCES', '').split(',')), 20):
    nombre, vid = par.split('=')
    if os.environ.get('ELEVENLABS_API_KEY'):
        MUESTRAS.append(('elevenlabs', vid.strip(), f'{n:02d}-elevenlabs-{nombre.strip().lower()}', {}))

for motor, voz, nombre, extra in MUESTRAS:
    tmp = Path('/tmp/muestra') / nombre
    tmp.mkdir(parents=True, exist_ok=True)
    conf = tmp / 'conf.json'
    conf.write_text(json.dumps({'motor': motor, 'voz': voz, 'pronunciacion': {'cour': 'cur'},
                                'textos': [{'clave': 'muestra', 'texto': TEXTO}], **extra}, ensure_ascii=False))
    try:
        subprocess.run(['python3', str(NARRAR), str(conf), str(tmp)], check=True)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(tmp / 'muestra.wav'), '-c:a', 'aac', '-b:a', '128k',
                        str(OUT / f'{nombre}.m4a')], check=True)
    except Exception as e:
        print(f'  ⚠ {nombre}: {e}')
print('\n'.join(sorted(p.name for p in OUT.iterdir())))
