import { readRange } from './utils/google.js';

export const handler = async () => {
  try {
    const rows = await readRange('roles!A:C');
    const [headers, ...data] = rows || [];
    const idx = Object.fromEntries(headers.map((x, i) => [x, i]));
    const out = data.map(r => ({
      id: r[idx.id] || '',
      name: r[idx.name] || '',
      ministry_id: r[idx.ministry_id] || ''
    }));
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(out)
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
