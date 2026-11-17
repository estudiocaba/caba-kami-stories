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
        texto = " || ' ' || ".join(f"coalesce(cast({c} as varchar),'')" for c in ['alt', 'title', 'tags', 'slug', 'url'] if c in cols)
        partes.append(f"SELECT id, lower({texto}) AS texto, coalesce(cast(alt as varchar),'') AS alt, width, height FROM read_parquet({urls!r}) WHERE height > width * 1.05")
        print(ds, len(urls), 'archivos', flush=True)
    except Exception as e:
        print(ds, 'falló:', e, flush=True)
con.execute("CREATE TABLE t AS " + " UNION ALL ".join(partes))
print(con.execute("SELECT count(*) FROM t").fetchone()[0], 'fotos verticales', flush=True)

salida = {}
for p in pedidos:
    q, cuantas = p['q'], p.get('cuantas', 10)
    palabras = [w for w in q.lower().split() if len(w) > 2]
    nota = ' + '.join(f"(CASE WHEN texto LIKE ? THEN 1 ELSE 0 END)" for _ in palabras)
    minimo = max(1, len(palabras) - 1) if len(palabras) > 2 else len(palabras)
    filas = con.execute(f"SELECT id, alt, width, height, {nota} AS n FROM t WHERE n >= ? ORDER BY n DESC, hash(id) LIMIT ?",
                        [f'%{w}%' for w in palabras] + [minimo, cuantas * 3]).fetchall()
    vistos, lista = set(), []
    for i, alt, w, h, n in filas:
        if i in vistos: continue
        vistos.add(i); lista.append({'id': int(i), 'alt': alt, 'ancho': w, 'alto': h})
        if len(lista) >= cuantas: break
    salida[q] = lista
    print(f'  «{q}»: {len(lista)}', flush=True)
json.dump(salida, open(sys.argv[2], 'w'))
