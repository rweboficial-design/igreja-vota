import { readRange, writeRange, appendRange, nowISO } from './utils/google.js';

function toObj(rows){
  const [h,...d]=rows || []; if(!h) return [];
  const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
  return d.map(r=>({ id:r[idx.id], ministry_id:r[idx.ministry_id], name:r[idx.name] }));
}

export const handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const rows = await readRange('roles!A:E');
      return { statusCode:200, body: JSON.stringify(toObj(rows)) };
    }
    if (event.httpMethod === 'POST') {
      const { ministry_id, name } = JSON.parse(event.body||'{}');
      const id = 'role_' + Math.random().toString(36).slice(2,8);
      const current = await readRange('roles!A:E');
      const row = [ id, ministry_id, name, nowISO(), nowISO() ];
      if (!current || current.length === 0) {
        await writeRange('roles!A1', [['id','ministry_id','name','created_at','updated_at'], row]);
      } else {
        await appendRange('roles!A:E', [ row ]);
      }
      return { statusCode:200, body: JSON.stringify({ id, ministry_id, name }) };
    }
    if (event.httpMethod === 'PUT') {
      const { id, name } = JSON.parse(event.body||'{}');
      const rows = await readRange('roles!A:E');
      const [h,...d]=rows || []; const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
      const i = d.findIndex(r=>r[idx.id]===id);
      if (i<0) return { statusCode:404, body:'Not found' };
      d[i][idx.name] = name; d[i][idx.updated_at] = nowISO();
      await writeRange('roles!A1', [h,...d]);
      return { statusCode:200, body: JSON.stringify({ ok:true }) };
    }
    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body||'{}');
      const rows = await readRange('roles!A:E');
      const [h,...d]=rows || []; const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
      const filtered = d.filter(r=>r[idx.id]!==id);
      await writeRange('roles!A1', [h,...filtered]);
      return { statusCode:200, body: JSON.stringify({ ok:true }) };
    }
    return { statusCode:405, body:'Method Not Allowed' };
  } catch(e){
    return { statusCode:500, body: JSON.stringify({ error:e.message }) };
  }
}