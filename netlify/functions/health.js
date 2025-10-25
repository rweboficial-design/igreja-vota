// netlify/functions/health.js
// Verifica se conseguimos ler e escrever no Sheets (aba "health").

import { readRange, writeRange, appendRange, nowISO } from './utils/google.js';

async function ensureHeader() {
  const rows = await readRange('health!A:B');
  if (!rows || rows.length === 0) {
    await writeRange('health!A1', [['at','ok']]);
  }
}

export const handler = async () => {
  try {
    await ensureHeader();
    const ts = nowISO();
    await appendRange('health!A:B', [[ts, '1']]); // escreve uma linha
    const rows = await readRange('health!A:B');
    return { statusCode: 200, body: JSON.stringify({ ok: true, rows: rows?.length || 0 }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};
