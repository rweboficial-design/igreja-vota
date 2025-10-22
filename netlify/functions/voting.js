import { readRange, appendRange } from './utils/google.js';

export const handler = async (event) => {
  try {
    if (event.httpMethod === 'POST') { // submit vote
      const { session_id='active', role_id, member_id, candidate_id } = JSON.parse(event.body||'{}');
      if(!candidate_id) return { statusCode:400, body:'candidate_id required' };
      const now = new Date().toISOString();
      const current = await readRange('votes!A:E');
      const row = [ session_id, role_id, member_id, candidate_id, now ];
      if (!current || current.length === 0) {
        await appendRange('votes!A:E', [['session_id','role_id','member_id','candidate_id','at'], row]);
      } else {
        await appendRange('votes!A:E', [row]);
      }
      return { statusCode:200, body: JSON.stringify({ ok:true }) };
    }
    if (event.httpMethod === 'GET') { // compute result for role
      const { role_id, finalize } = event.queryStringParameters || {};
      const rows = await readRange('votes!A:E');
      const [h,...d]=rows || []; if(!h) return { statusCode:200, body:'[]' };
      const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
      const counts = {};
      d.filter(r=>r[idx.role_id]===role_id).forEach(r=>{
        const n=r[idx.candidate_id]; counts[n]=(counts[n]||0)+1;
      });
      const ranking = Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([id,c])=>({ id, votes:c }));
      const out = { elected_id: ranking[0]?.id || null, ranking };
      if (finalize==='1') {
        // write into results
        const json = JSON.stringify(ranking);
        const now = new Date().toISOString();
        const header = ['session_id','role_id','elected_id','ranking_json','at'];
        const current = await readRange('results!A:E');
        const row = [ 'active', role_id, out.elected_id, json, now ];
        if (!current || current.length === 0) {
          await appendRange('results!A:E', [header, row]);
        } else {
          await appendRange('results!A:E', [row]);
        }
      }
      return { statusCode:200, body: JSON.stringify(out) };
    }
    return { statusCode:405, body:'Method Not Allowed' };
  } catch(e){
    return { statusCode:500, body: JSON.stringify({ error:e.message }) };
  }
}