// Comprobación de la conexión con Instagram: qué cuentas ve el token y si @caba.kami está entre ellas.
// Se lanza desde Actions → «Comprobar Instagram». No publica nada.

import { readFileSync } from 'node:fs';
import { listIgAccounts, publishingLimit } from './instagram.js';

const config = JSON.parse(readFileSync(new URL('../config.json', import.meta.url)));
const token = process.env.INSTAGRAM_ACCESS_TOKEN;

async function main() {
  if (!token) {
    console.error('Falta el secreto INSTAGRAM_ACCESS_TOKEN.');
    process.exit(1);
  }
  const accounts = await listIgAccounts(token);
  if (!accounts.length) {
    console.error('El token no ve ninguna cuenta de Instagram. Revisa que el usuario del sistema tenga asignadas la página de Facebook y la cuenta de Instagram.');
    process.exit(1);
  }
  console.log('Cuentas de Instagram que ve el token:');
  for (const a of accounts) console.log(`  @${a.username} (id ${a.id}) — página: ${a.page}`);

  const wanted = config.handle.replace(/^@/, '').toLowerCase();
  const match = accounts.find(a => a.username?.toLowerCase() === wanted);
  if (!match) {
    console.error(`\n✗ No aparece ${config.handle}.`);
    process.exit(1);
  }
  const limit = await publishingLimit(token, match.id).catch(e => ({ error: e.message }));
  console.log(`\n✓ ${config.handle} conectada. Uso de publicaciones en las últimas 24 h:`, JSON.stringify(limit));
}

main().catch(err => { console.error(err.message); process.exit(1); });
