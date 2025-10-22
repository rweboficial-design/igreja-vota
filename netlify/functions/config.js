import { readRange, writeRange } from './utils/google.js';

export const handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const rows = await readRange('config!A:B');
      const map = Object.fromEntries((rows || []).filter(r=>r.length>=2));
      return { statusCode: 200, body: JSON.stringify(map) };
    }
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body||'{}');
      const kv = Object.entries(body);
      const rows = [['key','value'], ...kv];
      await writeRange('config!A1', rows);
      return { statusCode: 200, body: JSON.stringify({ ok:true }) };
    }
    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}