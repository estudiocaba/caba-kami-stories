"""Busca fotos de Pexels en los índices públicos de Hugging Face (copias de los datos de la API de Pexels).

  python3 src/clientes/indice_pexels.py pedidos.json salida.json

pedidos.json: [{"q": "copper hair woman", "cuantas": 10}, …]
salida.json:  {"copper hair woman": [{"id", "alt", "ancho", "alto"}, …], …}
Solo fotos verticales. La licencia Pexels permite el uso comercial sin atribución.
"""
import json, sys, urllib.request
import duckdb

INDICES = ['bghira/photo-concept-bucket', 'gaunernst/pexels-portrait']
pedidos = json.load(open(sys.argv[1]))
con = duckdb.connect()
con.execute("INSTALL httpfs; LOAD httpfs;")
partes = []
for ds in INDICES:
    try:
        with urllib.request.urlopen(f'https://huggingface.co/api/datasets/{ds}/parquet', timeout=60) as r:
            urls = json.load(r)
        urls = [u for v in (urls.values() if isinstance(urls, dict) else [urls]) for u in (v.values() if isinstance(v, dict) else [v]) for u in (u if isinstance(u, list) else [u])]
        urls = [u for u in urls if isinstance(u, str) and u.endswith('.parquet')]
        cols = {r[0] for r in con.execute(f"DESCRIBE SELECT * FROM read_parquet({urls!r})").fetchall()}
        desc = " || ' ' || ".join(f"coalesce(cast({c} as varchar),'')" for c in ['alt', 'title'] if c in cols)
        etiq = "coalesce(cast(tags as varchar),'')" if 'tags' in cols else "''"
        partes.append(f"SELECT id, lower({desc}) AS descr, lower({etiq}) AS etiq, coalesce(cast(alt as varchar),'') AS alt, width, height FROM read_parquet({urls!r}) WHERE height > width * 1.05")
        print(ds, len(urls), 'archivos', flush=True)
    except Exception as e:
        print(ds, 'falló:', e, flush=True)
con.execute("CREATE TABLE t AS " + " UNION ALL ".join(partes))
print(con.execute("SELECT count(*) FROM t").fetchone()[0], 'fotos verticales', flush=True)

GENERICAS = {'woman', 'man', 'portrait', 'girl', 'women', 'men', 'photo', 'with'}

def buscar(palabras, cuantas):
    conds, nota, args_c, args_n = [], [], [], []
    for w in palabras:
        rx = r'\b' + w
        conds.append("(regexp_matches(descr, ?) OR regexp_matches(etiq, ?))"); args_c += [rx, rx]
        nota.append("(CASE WHEN regexp_matches(descr, ?) THEN 2 ELSE 0 END + CASE WHEN regexp_matches(etiq, ?) THEN 1 ELSE 0 END)"); args_n += [rx, rx]
    sql = f"SELECT id, alt, width, height, {' + '.join(nota)} AS n FROM t WHERE {' AND '.join(conds)} ORDER BY n DESC, hash(id) LIMIT ?"
    return con.execute(sql, args_n + args_c + [cuantas * 3]).fetchall()

salida = {}
for p in pedidos:
    q, cuantas = p['q'], p.get('cuantas', 10)
    palabras = [w for w in q.lower().split() if len(w) > 2 and w != 'with']
    vistos, lista = set(), []
    intento = palabras
    while intento and len(lista) < cuantas:
        for i, alt, w, h, n in buscar(intento, cuantas):
            if i in vistos: continue
            vistos.add(i); lista.append({'id': int(i), 'alt': alt, 'ancho': w, 'alto': h})
            if len(lista) >= cuantas: break
        # se relaja la búsqueda quitando primero las palabras genéricas, luego la primera
        genericas = [w for w in intento if w in GENERICAS]
        intento = [w for w in intento if w != (genericas[-1] if genericas else intento[0])] if len(intento) > 1 else []
    salida[q] = lista
    print(f'  «{q}»: {len(lista)}', flush=True)
json.dump(salida, open(sys.argv[2], 'w'))
