// netlify/functions/presence.js
// -------------------------------------------------------------
// Controla presença em tempo real (último ping de cada membro).
// Aba: presence -> member_id | name | last_seen
// -------------------------------------------------------------
import { readRange, writeRange, appendRange, nowISO } from './utils/google.js';

function idxMap(headers = []) {
  return Object.fromEntries(headers.map((h, i) => [String(h), i]));
}

export const handler = async (event) => {
  try {
    const method = event.httpMethod;
    if (method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: '',
      };
    }

    // ----------------- PING: POST -----------------
    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { member_id, name } = body;
      if (!member_id) return { statusCode: 400, body: 'member_id required' };

      const now = nowISO();
      const rows = await readRange('presence!A:C');
      if (!rows || rows.length === 0) {
        await writeRange('presence!A1:C1', [['member_id', 'name', 'last_seen']]);
        await appendRange('presence!A:C', [[member_id, name || '', now]]);
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: true }) };
      }

      const [h, ...data] = rows;
      const idx = idxMap(h);
      const rowIndex = data.findIndex(r => r[idx.member_id] === member_id);

      if (rowIndex >= 0) {
        // atualiza linha existente
        const excelRow = rowIndex + 2;
        await writeRange(`presence!A${excelRow}:C${excelRow}`, [[member_id, name || '', now]]);
      } else {
        // adiciona nova
        await appendRange('presence!A:C', [[member_id, name || '', now]]);
      }

      return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: true }) };
    }

    // ----------------- STATUS: GET -----------------
    if (method === 'GET') {
      const rows = await readRange('presence!A:C');
      if (!rows || rows.length <= 1) {
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ active_count: 0 }) };
      }
      const [, ...data] = rows;
      const active = [];
      const now = Date.now();
      data.forEach(r => {
        const last = new Date(r[2]).getTime();
        if (now - last <= 2 * 60 * 1000) active.push(r[0]);
      });
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ active_count: active.length, active_members: active }),
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (e) {
    console.error('presence error:', e);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message }),
    };
  }
};
