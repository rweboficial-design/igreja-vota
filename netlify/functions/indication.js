import { readRange, writeRange, appendRange, nowISO } from './utils/google.js';

// Garante cabeçalho na aba indications
async function ensureHeader() {
  const rows = await readRange('indications!A:E');
  if (!rows || rows.length === 0) {
    await writeRange('indications!A1', [['session_id','role_id','member_id','nominee_id','at']]);
  }
}

// Tenta obter um session_id corrente de uma aba "sessions"; caso não exista, cria um genérico
async function getSessionIdFallback(role_id) {
  try {
    const rows = await readRange('sessions!A:F'); // id,status,ministry_id,role_id,stage,updated_at
    const [h, ...d] = rows || [];
    if (h && d && d.length) {
      const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
      // Procura sessão com role_id e status ativa
      const active = d.find(r => r && r[idx.role_id] === role_id && (r[idx.status] === 'open' || r[idx.stage] === 'indication'));
      if (active) return active[idx.id];
      // Se não achou, pega a última válida
      const last = d[d.length - 1];
      if (last) return last[idx.id];
    }
  } catch {}
  // Fallback
  return 'sess_' + (role_id || 'generic');
}

export const handler = async (event) => {
  try {
    const method = event.httpMethod;

    if (method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: ''
      };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { role_id, nominees, member_id } = body;

      if (!role_id) {
        return { statusCode: 400, body: 'role_id is required' };
      }
      if (!Array.isArray(nominees) || nominees.length === 0) {
        return { statusCode: 400, body: 'nominees must be a non-empty array' };
      }

      await ensureHeader();

      const session_id = await getSessionIdFallback(role_id);
      const now = nowISO();

      // Grava até 3 indicações por membro
      const rows = nominees.slice(0,3).map(n => [
        session_id,
        role_id,
        member_id || 'anonymous',  // se não houver identificação do membro, grava 'anonymous'
        n,
        now
      ]);

      await appendRange('indications!A:E', rows);

      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, count: rows.length })
      };
    }

    if (method === 'GET') {
      // Útil para depurar
      await ensureHeader();
      const rows = await readRange('indications!A:E');
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
      return { statusCode: 200, body: JSON.stringify(out) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
