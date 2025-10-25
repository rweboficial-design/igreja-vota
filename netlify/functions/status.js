// netlify/functions/status.js
import { readRange } from './utils/google.js';
import { withCache } from './utils/cache.js';

function idxMap(headerRow = []) {
  return Object.fromEntries(headerRow.map((h, i) => [String(h).trim(), i]));
}
function truthy(v) {
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'sim' || s === 'yes' || s === 'y';
}

async function getStatusRaw() {
  // 1) Sessão
  const sessions = await readRange('sessions!A:F').catch(()=>[]);
  let session = { id: null, status: 'closed', ministry_id: '', role_id: '', stage: 'none', updated_at: null };
  if (sessions && sessions.length > 1) {
    const [h, ...rows] = sessions;
    const idx = idxMap(h);
    const last = rows[rows.length - 1] || [];
    session = {
      id: last[idx.id] || null,
      status: last[idx.status] || 'open',
      ministry_id: last[idx.ministry_id] || '',
      role_id: last[idx.role_id] || '',
      stage: last[idx.stage] || 'none',
      updated_at: last[idx.updated_at] || null,
    };
  }
  const indication_active = session.stage === 'indication';
  const voting_active = session.stage === 'voting';

  // 2) Nomes
  let ministry_name = '-', role_name = '-';
  const ministries = await readRange('ministries!A:B').catch(()=>[]);
  const roles = await readRange('roles!A:C').catch(()=>[]);
  if (ministries && ministries.length > 1) {
    const [mh, ...mr] = ministries;
    const mi = idxMap(mh);
    const mrow = mr.find(r => r[mi.id] === session.ministry_id);
    if (mrow) ministry_name = mrow[mi.name] || '-';
  }
  if (roles && roles.length > 1) {
    const [rh, ...rr] = roles;
    const ri = idxMap(rh);
    const rrow = rr.find(r => r[ri.id] === session.role_id);
    if (rrow) role_name = rrow[ri.name] || '-';
  }

  // 3) Total membros ativos
  const membersRows = await readRange('members!A:D').catch(()=>[]);
  let total_members = 0;
  if (membersRows && membersRows.length > 1) {
    const [mh, ...mr] = membersRows;
    const mi = idxMap(mh);
    total_members = mr.filter(r => truthy(r[mi.active])).length;
  }

  // 4) Presença (últimos 2 min)
  let logged_count = total_members;
  try {
    const presRows = await readRange('presence!A:C').catch(()=>[]);
    if (presRows && presRows.length > 1) {
      const [, ...data] = presRows;
      const now = Date.now();
      const active = data.filter(r => now - new Date(r[2]).getTime() <= 2 * 60 * 1000);
      logged_count = active.length;
    }
  } catch {}

  // 5) Participação
  let voted_count = 0, indicated_count = 0;
  if (voting_active && session.role_id && session.id) {
    const votesRows = await readRange('votes!A:E').catch(()=>[]);
    if (votesRows && votesRows.length > 1) {
      const [vh, ...vr] = votesRows;
      const vi = idxMap(vh);
      const set = new Set();
      vr.forEach(r => {
        if (r[vi.role_id] === session.role_id && r[vi.session_id] === session.id && r[vi.member_id]) {
          set.add(r[vi.member_id]);
        }
      });
      voted_count = set.size;
    }
  }
  if (indication_active && session.role_id && session.id) {
    const indRows = await readRange('indications!A:E').catch(()=>[]);
    if (indRows && indRows.length > 1) {
      const [ih, ...ir] = indRows;
      const ii = idxMap(ih);
      const set = new Set();
      ir.forEach(r => {
        if (r[ii.role_id] === session.role_id && r[ii.session_id] === session.id && r[ii.member_id]) {
          set.add(r[ii.member_id]);
        }
      });
      indicated_count = set.size;
    }
  }
  const participated_count = voting_active ? voted_count : (indication_active ? indicated_count : 0);

  return {
    ministry_id: session.ministry_id || '',
    role_id: session.role_id || '',
    ministry_name, role_name,
    stage: session.stage,
    indication_active, voting_active,
    updated_at: session.updated_at,
    total_members, logged_count,
    voted_count, indicated_count, participated_count,
    timestamp: new Date().toISOString(),
  };
}

export const handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers: {
        'Access-Control-Allow-Origin':'*',
        'Access-Control-Allow-Methods':'GET, OPTIONS',
        'Access-Control-Allow-Headers':'Content-Type',
      }, body:'' };
    }
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
    // CACHE 5s (já derruba pico de leituras)
    const payload = await withCache('status:global', 5_000, getStatusRaw);
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin':'*' }, body: JSON.stringify(payload) };
  } catch (e) {
    console.error('Erro API /status:', e);
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin':'*' }, body: JSON.stringify({ error: e.message }) };
  }
};
