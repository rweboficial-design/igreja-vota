// netlify/functions/session.js
import { readRange, writeRange, nowISO } from './utils/google.js';

export const handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const rows = await readRange('sessions!A1:F2'); // só cabeçalho + linha active
      const [h, row] = rows || [];
      if (!h || !row) {
        return {
          statusCode: 200,
          body: JSON.stringify({ id: 'active', status: 'idle', stage: 'none' }),
        };
      }
      const out = {
        id: row[0],
        status: row[1],
        ministry_id: row[2],
        role_id: row[3],
        stage: row[4],
        updated_at: row[5],
      };
      return { statusCode: 200, body: JSON.stringify(out) };
    }

    if (event.httpMethod === 'POST') {
      const {
        stage = 'none',
        status = 'idle',
        ministry_id = '',
        role_id = '',
      } = JSON.parse(event.body || '{}');

      // garante cabeçalho + escreve SOMENTE A2:F2 (muito mais rápido)
      const header = [['id','status','ministry_id','role_id','stage','updated_at']];
      const now = nowISO();

      // lê só a primeira célula pra ver se existe header
      const existing = await readRange('sessions!A1:A1');
      if (!existing || !existing[0] || existing[0][0] !== 'id') {
        await writeRange('sessions!A1', header);
      }

      await writeRange('sessions!A2:F2', [['active', status, ministry_id, role_id, stage, now]]);

      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (e) {
    console.error('session error:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message || String(e) }) };
  }
};
