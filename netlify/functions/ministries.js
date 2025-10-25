import { readRange, writeRange, appendRange, nowISO } from './utils/google.js';

async function ensureMinistriesHeader(){
  const rows = await readRange('ministries!A:D');
  if (!rows || rows.length === 0) {
    await writeRange('ministries!A1', [['id','name','created_at','updated_at']]);
  }
}

export const handler = async (event) => {
  try{
    const method = event.httpMethod;

    if (method === 'GET') {
      await ensureMinistriesHeader();
      const rows = await readRange('ministries!A:D');
      const [h,...d] = rows || [];
      if (!h) return { statusCode:200, body:'[]' };
      const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
      const out = d.filter(r=>r && r.length)
        .map(r=>({ id:r[idx.id], name:r[idx.name], created_at:r[idx.created_at], updated_at:r[idx.updated_at] }));
      return { statusCode:200, body: JSON.stringify(out) };
    }

    if (method === 'POST') {
      const { name } = JSON.parse(event.body||'{}');
      if (!name || !String(name).trim()) return { statusCode:400, body:'name is required' };
      await ensureMinistriesHeader();
      const id = 'min_' + Math.random().toString(36).slice(2,8);
      const now = nowISO();
      await appendRange('ministries!A:D', [[ id, String(name).trim(), now, now ]]);
      return { statusCode:200, body: JSON.stringify({ ok:true, id }) };
    }

    if (method === 'PUT') {
      const { id, name } = JSON.parse(event.body||'{}');
      if (!id) return { statusCode:400, body:'id is required' };
      const rows = await readRange('ministries!A:D');
      const [h,...d] = rows || [];
      if (!h) return { statusCode:404, body:'sheet missing' };
      const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
      const i = d.findIndex(r=>r[idx.id]===id);
      if (i<0) return { statusCode:404, body:'not found' };
      if (name!==undefined) d[i][idx.name] = String(name).trim();
      d[i][idx.updated_at] = nowISO();
      await writeRange('ministries!A1', [h, ...d]);
      return { statusCode:200, body: JSON.stringify({ ok:true }) };
    }

    if (method === 'DELETE') {
      const { id } = JSON.parse(event.body||'{}');
      if (!id) return { statusCode:400, body:'id is required' };
      const rows = await readRange('ministries!A:D');
      const [h,...d] = rows || [];
      if (!h) return { statusCode:404, body:'sheet missing' };
      const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
      const filtered = d.filter(r=>r[idx.id]!==id);
      await writeRange('ministries!A1', [h, ...filtered]);
      return { statusCode:200, body: JSON.stringify({ ok:true }) };
    }

    return { statusCode:405, body:'Method Not Allowed' };
  }catch(e){
    return { statusCode:500, body: JSON.stringify({ error:e.message }) };
  }
}
