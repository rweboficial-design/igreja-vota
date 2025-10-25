// netlify/functions/indications.js
// ==========================================================
// Função responsável por registrar indicações no Google Sheets
// ==========================================================

import { readRange, writeRange, appendRange, nowISO } from './utils/google.js';

// garante que a aba indications tenha cabeçalho
async function ensureHeader() {
  const rows = await readRange('indications!A:E');
  if (!rows || rows.length === 0) {
    await writeRange('indications!A1', [
      ['session_id', 'role_id', 'member_id', 'nominee_id', 'at'],
    ]);
  }
}

// tenta identificar sessão ativa para o cargo
async function getSessionIdFallback(role_id) {
  try {
    const rows = await readRange('sessions!A:F');
    const [h, ...d] = rows || [];
    if (h && d && d.length) {
      const idx = Object.fromEntries(h.map((x, i) => [x, i]));
      const active = d.find(
        (r) =>
          r &&
          r[idx.role_id] === role_id &&
          (r[idx.status] === 'open' || r[idx.stage] === 'indication')
      );
      if (active) return active[idx.id];
      const last = d[d.length - 1];
      if (last) return last[idx.id];
    }
  } catch (e) {
    console.warn('fallback session_id error:', e.message);
  }
  return 'sess_' + (role_id || 'default');
}

// função principal da API
export const handler = async (event) => {
  try {
    const method = event.httpMethod;

    // permite CORS
    if (method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: '',
      };
    }

    // ========================================================
    // POST  -> grava novas indicações
    // ========================================================
    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { role_id, nominees, member_id } = body;

      if (!role_id)
        return { statusCode: 400, body: 'Campo role_id é obrigatório' };
      if (!Array.isArray(nominees) || nominees.length === 0)
        return {
          statusCode: 400,
          body: 'nominees deve ser uma lista com ao menos um item',
        };

      await ensureHeader();

      const session_id = await getSessionIdFallback(role_id);
      const now = nowISO();

      const linhas = nominees.slice(0, 3).map((n) => [
        session_id,
        role_id,
        member_id || 'anonymous',
        n,
        now,
      ]);

      await appendRange('indications!A:E', linhas);

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true, count: linhas.length }),
      };
    }

    // ========================================================
    // GET  -> lista indicações já gravadas
    // ========================================================
    if (method === 'GET') {
      await ensureHeader();
      const rows = await readRange('indications!A:E');
      const [h, ...d] = rows || [];
      if (!h) return { statusCode: 200, body: '[]' };
      const idx = Object.fromEntries(h.map((x, i) => [x, i]));
      const out = d.map((r) => ({
        session_id: r[idx.session_id],
        role_id: r[idx.role_id],
        member_id: r[idx.member_id],
        nominee_id: r[idx.nominee_id],
        at: r[idx.at],
      }));
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(out),
      };
    }

    // método não permitido
    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (e) {
    console.error('Erro API indications:', e);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message }),
    };
  }
};
