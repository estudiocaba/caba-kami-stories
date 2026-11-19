"""Quita fondos para las fichas de cliente (estilo lotería).

  python3 src/clientes/recortar.py <carpeta del cliente> <pedidos.json> <salida.json>

pedidos.json: [{"ref": "fotos/x.jpg", "modo": "sinfondo"}, …]
  sinfondo → PNG del sujeto sin fondo (décimo, trabajadora)
salida.json:  {"fotos/x.jpg|sinfondo": "fotos/_recortes/x-sinfondo.png", …}
Con "delante": "auto" la ficha pide el recorte del sujeto principal de la foto de fondo (un castillo, una torre…), del
mismo tamaño que la foto, para ponerlo por delante del décimo: es el mismo modo "sinfondo" aplicado al fondo.
"""
import json, os, sys
from rembg import remove, new_session
from PIL import Image

dir_cliente, pedidos, salida = sys.argv[1:4]
sesion = new_session('isnet-general-use')
hechos = {}
os.makedirs(os.path.join(dir_cliente, 'fotos', '_recortes'), exist_ok=True)
for p in json.load(open(pedidos)):
    ref = p['ref']; origen = os.path.join(dir_cliente, ref)
    if not os.path.exists(origen):
        print(f'  no existe {ref}'); continue
    base = os.path.splitext(os.path.basename(ref))[0]
    destino = f'fotos/_recortes/{base}-sinfondo.png'
    im = Image.open(origen).convert('RGBA')
    remove(im, session=sesion, post_process_mask=True).save(os.path.join(dir_cliente, destino))
    hechos[f'{ref}|sinfondo'] = destino
    print(f'  ✓ {ref} → {destino}')
json.dump(hechos, open(salida, 'w'))
