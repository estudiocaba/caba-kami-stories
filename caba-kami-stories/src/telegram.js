// Telegram a veces no responde desde los servidores de GitHub: se reintenta hasta 4 veces.
export async function fetchConReintento(url, opciones, intentos = 4) {
  for (let i = 1; ; i++) {
    try { return await fetch(url, { ...opciones, signal: AbortSignal.timeout(60000) }); }
    catch (e) {
      if (i >= intentos) throw e;
      console.log(`  Telegram no responde (${e.cause?.code ?? e.message}), reintento ${i}…`);
      await new Promise(r => setTimeout(r, 5000 * i));
    }
  }
}

// Envía la imagen (y el texto sugerido) por un bot de Telegram. Gratis.

export async function sendToTelegram({ token, chatId, png, filename, caption, text }) {
  const api = `https://api.telegram.org/bot${token}`;

  const form = new FormData();
  form.append('chat_id', chatId);
  // Como documento, para que Telegram no comprima la imagen.
  form.append('document', new Blob([png], { type: 'image/png' }), filename);
  form.append('caption', caption.slice(0, 1000));
  const res = await fetchConReintento(`${api}/sendDocument`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Telegram respondió ${res.status}: ${await res.text()}`);

  if (text) {
    const r2 = await fetchConReintento(`${api}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!r2.ok) throw new Error(`Telegram respondió ${r2.status}: ${await r2.text()}`);
  }
}

// Manda varias imágenes juntas (hasta 10) como documentos, para que Telegram no las comprima.
export async function sendDocumentGroup({ token, chatId, files, caption }) {
  const form = new FormData();
  form.append('chat_id', chatId);
  const media = files.slice(0, 10).map((f, i) => ({
    type: 'document',
    media: `attach://f${i}`,
    ...(i === files.length - 1 && caption ? { caption: caption.slice(0, 1000) } : {}),
  }));
  form.append('media', JSON.stringify(media));
  files.slice(0, 10).forEach((f, i) => form.append(`f${i}`, new Blob([f.data], { type: 'image/png' }), f.name));
  const res = await fetchConReintento(`https://api.telegram.org/bot${token}/sendMediaGroup`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Telegram respondió ${res.status}: ${await res.text()}`);
}

export async function sendText({ token, chatId, text }) {
  const res = await fetchConReintento(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) throw new Error(`Telegram respondió ${res.status}: ${await res.text()}`);
}
