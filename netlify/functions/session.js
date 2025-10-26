// netlify/functions/session.js
import { readRange, writeRange, nowISO } from './utils/google.js';

export const handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const rows = await readRange('sessions!A:F');
      const [h, ...d] = rows || [];
      if (!h)
        return {
          statusCode: 200,
          body: JSON.stringify({ id: 'active', status: 'idle', stage: 'none' }),
        };

      const idx = Object.fromEntries(h.map((x, i) => [x, i]));
      const s = d.find((r) => r[idx.id] === 'active');
      if (!s)
        return {
          statusCode: 200,
          body: JSON.stringify({ id: 'active', status: 'idle', stage: 'none' }),
        };

      const out = {
        id: s[idx.id],
        status: s[idx.status],
        ministry_id: s[idx.ministry_id],
        role_id: s[idx.role_id],
        stage: s[idx.stage],
        updated_at: s[idx.updated_at],
      };
      return { statusCode: 200, body: JSON.stringify(out) };
    }

    if (event.httpMethod === 'POST') {
      const {
        stage = 'none',
        status = 'idle',
        ministry_id = null,
        role_id = null,
      } = JSON.parse(event.body || '{}');

      const rows = await readRange('sessions!A:F');
      if (!rows || rows.length === 0) {
        await writeRange('sessions!A1', [
          ['id', 'status', 'ministry_id', 'role_id', 'stage', 'updated_at'],
          ['active', status, ministry_id, role_id, stage, nowISO()],
        ]);
        return { statusCode: 200, body: JSON.stringify({ ok: true }) };
      }

      const [h, ...d] = rows;
      const idx = Object.fromEntries(h.map((x, i) => [x, i]));
      let found = d.find((r) => r[idx.id] === 'active');

      if (!found) {
        d.push(['active', status, ministry_id, role_id, stage, nowISO()]);
      } else {
        found[idx.status] = status;
        found[idx.ministry_id] = ministry_id;
        found[idx.role_id] = role_id;
        found[idx.stage] = stage;
        found[idx.updated_at] = nowISO();
      }

      await writeRange('sessions!A1', [h, ...d]);
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (e) {
    console.error('session error:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message || String(e) }) };
  }
};
