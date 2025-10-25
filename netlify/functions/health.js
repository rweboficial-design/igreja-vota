// netlify/functions/health.js
// Teste de leitura/escrita na aba "health" (auto-criação ativada).

import { readRange, appendRange, nowISO } from './utils/google.js';

export const handler = async () => {
  try {
    // readRange/appendRange já garantem criar a aba e cabeçalho (via utils)
    const ts = nowISO();
    await appendRange('health!A:B', [[ts, '1']]);
    const rows = await readRange('health!A:B');
    return { statusCode: 200, body: JSON.stringify({ ok: true, rows: rows?.length || 0 }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};
