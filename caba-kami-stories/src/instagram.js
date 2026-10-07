// Publicación en Instagram con la API oficial de Meta (Graph API, gratis).
// Necesita un token con permisos instagram_basic, instagram_content_publish,
// pages_show_list y pages_read_engagement (ver README).

const BASE = process.env.GRAPH_BASE || 'https://graph.facebook.com';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function graph(method, path, params, token) {
  const url = new URL(BASE + path);
  const init = { method, headers: { Authorization: `Bearer ${token}` } };
  if (method === 'GET') {
    for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
  } else {
    init.body = new URLSearchParams(params ?? {});
  }
  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const e = json.error ?? {};
    const detail = [e.error_user_title, e.error_user_msg || e.message].filter(Boolean).join(': ');
    throw new Error(`Meta respondió ${res.status} (código ${e.code ?? '?'}${e.error_subcode ? '/' + e.error_subcode : ''}): ${detail || JSON.stringify(json)}`);
  }
  return json;
}

// Busca las cuentas de Instagram conectadas a las páginas de Facebook a las que tiene acceso el token.
export async function listIgAccounts(token) {
  const res = await graph('GET', '/me/accounts', {
    fields: 'name,instagram_business_account{id,username}', limit: '100',
  }, token);
  return (res.data ?? [])
    .filter(p => p.instagram_business_account)
    .map(p => ({ page: p.name, id: p.instagram_business_account.id, username: p.instagram_business_account.username }));
}

export async function findIgUserId(token, handle) {
  const wanted = handle.replace(/^@/, '').toLowerCase();
  const accounts = await listIgAccounts(token);
  const match = accounts.find(a => a.username?.toLowerCase() === wanted);
  if (!match) {
    const seen = accounts.map(a => '@' + a.username).join(', ') || 'ninguna';
    throw new Error(`El token no tiene acceso a @${wanted}. Cuentas que ve: ${seen}.`);
  }
  return match.id;
}

export async function publishingLimit(token, igUserId) {
  const res = await graph('GET', `/${igUserId}/content_publishing_limit`, { fields: 'config,quota_usage' }, token);
  return res.data?.[0];
}

// Publica una imagen (JPEG en una URL pública) como story.
export async function publishStory({ token, igUserId, imageUrl, log = console.log }) {
  const container = await graph('POST', `/${igUserId}/media`, { media_type: 'STORIES', image_url: imageUrl }, token);
  log(`Contenedor creado: ${container.id}`);

  // Meta procesa la imagen; se comprueba cada 15 s durante un máximo de 5 min.
  for (let i = 0; i < 20; i++) {
    const st = await graph('GET', `/${container.id}`, { fields: 'status_code,status' }, token);
    log(`Estado: ${st.status_code}`);
    if (st.status_code === 'FINISHED') break;
    if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') {
      throw new Error(`Instagram no pudo procesar la imagen: ${st.status ?? st.status_code}`);
    }
    await sleep(Number(process.env.POLL_MS ?? 15000));
  }

  const published = await graph('POST', `/${igUserId}/media_publish`, { creation_id: container.id }, token);
  return published.id;
}
