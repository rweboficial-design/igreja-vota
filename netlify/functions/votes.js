// netlify/functions/votes.js
// Registra votos na aba "votes" (auto-criação de aba/cabeçalho).
// Colunas: session_id | role_id | member_id | nominee_id | at

import { readRange, appendRange, nowISO } from './utils/google.js';

async function getSessionIdFallback(role_id) {
  try {
    const rows = await readRange('sessions!A:F'); // id,status,ministry_id,role_id,stage,updated_at
    const [h, ...d] = rows || [];
    if (h && d && d.length) {
      const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
      const active = d.find(r =>
        r &&
        r[idx.role_id] === role_id &&
        (r[idx.status] === 'open' || r[idx.stage] === 'voting')
      );
      if (active) return active[idx.id];
      const last = d[d.length - 1];
      if (last) return last[idx.id];
    }
  } catch {}
  return 'sess_' + (role_id || 'default');
}

async function appendWithRetry(range, rows, tries = 3) {
  let lastErr;
  for (let i=0; i<tries; i++) {
    try { await appendRange(range, rows); return true; }
    catch (e) { lastErr = e; await new Promise(r=>setTimeout(r, 300*(i+1))); }
  }
  throw lastErr;
}

export const handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
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

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { role_id, nominee_id, member_id } = body;
      if (!role_id) return { statusCode: 400, body: 'role_id é obrigatório' };
      if (!nominee_id) return { statusCode: 400, body: 'nominee_id é obrigatório' };

      const session_id = await getSessionIdFallback(role_id);
      const now = nowISO();
      const linha = [[ session_id, role_id, member_id || 'anonymous', nominee_id, now ]];

      await appendWithRetry('votes!A:E', linha, 3);

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true, saved: 1 }),
      };
    }

    if (event.httpMethod === 'GET') {
      const rows = await readRange('votes!A:E');
      const [h, ...d] = rows || [];
      if (!h) return { statusCode: 200, body: '[]' };
      const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
      const out = d.map(r => ({
        session_id: r[idx.session_id],
        role_id:    r[idx.role_id],
        member_id:  r[idx.member_id],
        nominee_id: r[idx.nominee_id],
        at:         r[idx.at],
      }));
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(out),
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (e) {
    console.error('Erro /votes:', e);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message }),
    };
  }
};
