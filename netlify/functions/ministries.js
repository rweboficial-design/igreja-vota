import { readRange, writeRange, appendRange, nowISO } from './utils/google.js';

function toObj(rows){
  const [header, ...data] = rows || []; if(!header) return [];
  const idx = Object.fromEntries(header.map((h,i)=>[h,i]));
  return data.map(r=>({ id:r[idx.id], name:r[idx.name], created_at:r[idx.created_at], updated_at:r[idx.updated_at] }));
}

export const handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const rows = await readRange('ministries!A:D');
      return { statusCode: 200, body: JSON.stringify(toObj(rows)) };
    }
    if (event.httpMethod === 'POST') {
      const { name } = JSON.parse(event.body||'{}');
      const id = 'min_' + Math.random().toString(36).slice(2,8);
      const rows = [['id','name','created_at','updated_at'], [ id, name, nowISO(), nowISO() ]];
      // append with header if sheet empty; safer approach: read and decide
      const current = await readRange('ministries!A:D');
      if (!current || current.length === 0) {
        await writeRange('ministries!A1', rows);
      } else {
        await appendRange('ministries!A:D', [rows[1]]);
      }
      return { statusCode: 200, body: JSON.stringify({ id, name }) };
    }
    if (event.httpMethod === 'PUT') {
      const { id, name } = JSON.parse(event.body||'{}');
      const rows = await readRange('ministries!A:D');
      const [header, ...data] = rows || []; const idx = Object.fromEntries(header.map((h,i)=>[h,i]));
      const i = data.findIndex(r=>r[idx.id]===id);
      if (i<0) return { statusCode:404, body:'Not found' };
      data[i][idx.name] = name; data[i][idx.updated_at] = nowISO();
      await writeRange('ministries!A1', [header, ...data]);
      return { statusCode:200, body: JSON.stringify({ ok:true }) };
    }
    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body||'{}');
      const rows = await readRange('ministries!A:D');
      const [header, ...data] = rows || []; const idx = Object.fromEntries(header.map((h,i)=>[h,i]));
      const filtered = data.filter(r=>r[idx.id]!==id);
      await writeRange('ministries!A1', [header, ...filtered]);
      return { statusCode:200, body: JSON.stringify({ ok:true }) };
    }
    return { statusCode:405, body:'Method Not Allowed' };
  } catch(e){
    return { statusCode:500, body: JSON.stringify({ error:e.message }) };
  }
}