import { readRange, appendRange } from './utils/google.js';

export const handler = async (event) => {
  try {
    if (event.httpMethod === 'POST') { // submit indication
      const { session_id='active', role_id, member_id, nominee_ids=[] } = JSON.parse(event.body||'{}');
      const ids = (nominee_ids||[]).slice(0,3);
      const now = new Date().toISOString();
      const rows = ids.map(n=>[session_id, role_id, member_id, n, now]);
      const current = await readRange('indications!A:E');
      if (!current || current.length === 0) {
        await appendRange('indications!A:E', [['session_id','role_id','member_id','nominee_id','at'], ...rows]);
      } else {
        await appendRange('indications!A:E', rows);
      }
      return { statusCode:200, body: JSON.stringify({ ok:true }) };
    }
    if (event.httpMethod === 'GET') { // tally top nominees for role
      const { role_id } = event.queryStringParameters || {};
      const rows = await readRange('indications!A:E');
      const [h,...d]=rows || []; if(!h) return { statusCode:200, body:'[]' };
      const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
      const counts = {};
      d.filter(r=>r[idx.role_id]===role_id).forEach(r=>{
        const n=r[idx.nominee_id]; counts[n]=(counts[n]||0)+1;
      });
      const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([id,c])=>({ id, indications:c }));
      return { statusCode:200, body: JSON.stringify(sorted) };
    }
    return { statusCode:405, body:'Method Not Allowed' };
  } catch(e){
    return { statusCode:500, body: JSON.stringify({ error:e.message }) };
  }
}