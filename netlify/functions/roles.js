import { readRange, writeRange, appendRange, nowISO } from './utils/google.js';

async function ensureRolesHeader(){
  const rows = await readRange('roles!A:E');
  if (!rows || rows.length === 0) {
    await writeRange('roles!A1', [['id','ministry_id','name','created_at','updated_at']]);
  }
}

export const handler = async (event) => {
  try{
    const method = event.httpMethod;

    if (method === 'GET') {
      await ensureRolesHeader();
      const url = new URL(event.rawUrl);
      const ministry_id = url.searchParams.get('ministry_id');
      const rows = await readRange('roles!A:E');
      const [h,...d] = rows || [];
      if (!h) return { statusCode:200, body:'[]' };
      const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
      let list = d.filter(r=>r && r.length).map(r=>({
        id:r[idx.id], ministry_id:r[idx.ministry_id], name:r[idx.name],
        created_at:r[idx.created_at], updated_at:r[idx.updated_at]
      }));
      if (ministry_id) list = list.filter(x=>x.ministry_id===ministry_id);
      return { statusCode:200, body: JSON.stringify(list) };
    }

    if (method === 'POST') {
      const { ministry_id, name } = JSON.parse(event.body||'{}');
      if (!ministry_id) return { statusCode:400, body:'ministry_id is required' };
      if (!name || !String(name).trim()) return { statusCode:400, body:'name is required' };
      await ensureRolesHeader();
      const id = 'role_' + Math.random().toString(36).slice(2,8);
      const now = nowISO();
      await appendRange('roles!A:E', [[ id, ministry_id, String(name).trim(), now, now ]]);
      return { statusCode:200, body: JSON.stringify({ ok:true, id }) };
    }

    if (method === 'PUT') {
      const { id, name } = JSON.parse(event.body||'{}');
      if (!id) return { statusCode:400, body:'id is required' };
      const rows = await readRange('roles!A:E');
      const [h,...d] = rows || [];
      if (!h) return { statusCode:404, body:'sheet missing' };
      const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
      const i = d.findIndex(r=>r[idx.id]===id);
      if (i<0) return { statusCode:404, body:'not found' };
      if (name!==undefined) d[i][idx.name] = String(name).trim();
      d[i][idx.updated_at] = nowISO();
      await writeRange('roles!A1', [h, ...d]);
      return { statusCode:200, body: JSON.stringify({ ok:true }) };
    }

    if (method === 'DELETE') {
      const { id } = JSON.parse(event.body||'{}');
      if (!id) return { statusCode:400, body:'id is required' };
      const rows = await readRange('roles!A:E');
      const [h,...d] = rows || [];
      if (!h) return { statusCode:404, body:'sheet missing' };
      const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
      const filtered = d.filter(r=>r[idx.id]!==id);
      await writeRange('roles!A1', [h, ...filtered]);
      return { statusCode:200, body: JSON.stringify({ ok:true }) };
    }

    return { statusCode:405, body:'Method Not Allowed' };
  }catch(e){
    return { statusCode:500, body: JSON.stringify({ error:e.message }) };
  }
}
