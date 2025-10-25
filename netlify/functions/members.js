import { readRange, writeRange, appendRange } from './utils/google.js';

// garante cabeçalho na aba "members"
async function ensureMembersHeader() {
  const rows = await readRange('members!A:D');
  if (!rows || rows.length === 0) {
    await writeRange('members!A1', [['id','name','photo_url','active']]);
  }
}

export const handler = async (event) => {
  try {
    const method = event.httpMethod;

    if (method === 'GET') {
      await ensureMembersHeader();
      const rows = await readRange('members!A:D');
      const [h, ...d] = rows || [];
      if (!h) return { statusCode: 200, body: '[]' };
      const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
      const out = d.filter(r=>r && r.length)
        .map(r => ({
          id: r[idx.id],
          name: r[idx.name],
          photo_url: r[idx.photo_url],
          active: String(r[idx.active]) === '1'
        }));
      return { statusCode: 200, body: JSON.stringify(out) };
    }

    if (method === 'POST') {
      // cadastro manual: { name, photo_url?, active? }
      const { name, photo_url = '', active = true } = JSON.parse(event.body || '{}');
      if (!name || !String(name).trim()) {
        return { statusCode: 400, body: 'name is required' };
      }
      await ensureMembersHeader();
      const id = 'mem_' + Math.random().toString(36).slice(2, 8);
      await appendRange('members!A:D', [[ id, String(name).trim(), String(photo_url||''), active ? '1' : '0' ]]);
      return { statusCode: 200, body: JSON.stringify({ ok:true, id }) };
    }

    if (method === 'DELETE') {
      const { id } = JSON.parse(event.body || '{}');
      if (!id) return { statusCode: 400, body: 'id is required' };
      const rows = await readRange('members!A:D');
      const [h, ...d] = rows || [];
      if (!h) return { statusCode: 404, body: 'members sheet missing' };
      const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
      const filtered = d.filter(r => r[idx.id] !== id);
      await writeRange('members!A1', [h, ...filtered]);
      return { statusCode: 200, body: JSON.stringify({ ok:true }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
