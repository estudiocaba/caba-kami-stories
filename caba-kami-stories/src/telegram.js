// Envía la imagen (y el texto sugerido) por un bot de Telegram. Gratis.

export async function sendToTelegram({ token, chatId, png, filename, caption, text }) {
  const api = `https://api.telegram.org/bot${token}`;

  const form = new FormData();
  form.append('chat_id', chatId);
  // Como documento, para que Telegram no comprima la imagen.
  form.append('document', new Blob([png], { type: 'image/png' }), filename);
  form.append('caption', caption.slice(0, 1000));
  const res = await fetch(`${api}/sendDocument`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Telegram respondió ${res.status}: ${await res.text()}`);

  if (text) {
    const r2 = await fetch(`${api}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!r2.ok) throw new Error(`Telegram respondió ${r2.status}: ${await r2.text()}`);
  }
}
