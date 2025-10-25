// netlify/functions/status.js
import { readRange, ensureSheet } from './utils/google.js';

// util
const norm = (v) => String(v ?? '').trim();
const idxMap = (hdr = []) =>
  Object.fromEntries(hdr.map((h, i) => [norm(h).toLowerCase(), i]));

function truthy(v) {
  const s = norm(v).toLowerCase();
  return s === '1' || s === 'true' || s === 'sim' || s === 'yes' || s === 'y';
}

async function getSession() {
  await ensureSheet('sessions', ['id','status','ministry_id','role_id','stage','updated_at']);
  const rows = await readRange('sessions!A:F').catch(() => []);
  if (!rows || rows.length < 2) return null;
  const [h, ...data] = rows;
  const i = idxMap(h);
  const last = data[data.length - 1] || [];
  return {
    id: norm(last[i.id]),
    status: norm(last[i.status] || 'open'),
    ministry_id: norm(last[i.ministry_id]),
    role_id: norm(last[i.role_id]),
    stage: norm(last[i.stage] || 'none'),
    updated_at: norm(last[i.updated_at]),
  };
}

async function getNames(ministry_id, role_id) {
  let ministry_name = '-', role_name = '-';

  await ensureSheet('ministries', ['id','name','created_at','updated_at']);
  const mins = await readRange('ministries!A:B').catch(() => []);
  if (mins.length > 1) {
    const [mh, ...mr] = mins;
    const mi = idxMap(mh);
    const found = mr.find(r => norm(r[mi.id]) === ministry_id);
    if (found) ministry_name = norm(found[mi.name]);
  }

  await ensureSheet('roles', ['id','ministry_id','name','created_at','updated_at']);
  const roles = await readRange('roles!A:C').catch(() => []);
  if (roles.length > 1) {
    const [rh, ...rr] = roles;
    const ri = idxMap(rh);
    const found = rr.find(r => norm(r[ri.id]) === role_id);
    if (found) role_name = norm(found[ri.name]);
  }

  return { ministry_name, role_name };
}

async function countMembersActive() {
  await ensureSheet('members', ['id','name','photo_url','active']);
  const rows = await readRange('members!A:D').catch(() => []);
  if (rows.length < 2) return { total: 0 };
  const [h, ...data] = rows;
  const i = idxMap(h);
  const total = data.filter(r => truthy(r[i.active])).length;
  return { total };
}

async function countLoggedUnique() {
  await ensureSheet('presence', ['member_id','member_name','at']);
  const rows = await readRange('presence!A:C').catch(() => []);
  if (rows.length < 2) return 0;
  const [, ...data] = rows;
  const now = Date.now();
  const cutoff = now - 120_000; // 120s
  const unique = new Set();
  for (const r of data) {
    const at = new Date(r[2]).getTime();
    if (!isNaN(at) && at >= cutoff) {
      const mid = norm(r[0]);
      if (mid) unique.add(mid);
    }
  }
  return unique.size;
}

export const handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }, body: '' };
    }
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const session = await getSession();
    const stage = session?.stage || 'none';
    const { ministry_id = '', role_id = '' } = session || {};
    const { ministry_name, role_name } = await getNames(ministry_id, role_id);
    const { total: total_members } = await countMembersActive();
    const logged_count = await countLoggedUnique();

    // participação
    let voted_count = 0, indicated_count = 0;
    if (stage === 'voting' && role_id && session?.id) {
      await ensureSheet('votes', ['session_id','role_id','member_id','candidate_id','at']);
      const rows = await readRange('votes!A:E').catch(()=>[]);
      if (rows.length > 1) {
        const [h, ...data] = rows;
        const i = idxMap(h);
        const set = new Set();
        data.forEach(r => {
          if (norm(r[i.role_id]) === role_id && norm(r[i.session_id]) === session.id && norm(r[i.member_id])) {
            set.add(norm(r[i.member_id]));
          }
        });
        voted_count = set.size;
      }
    }
    if (stage === 'indication' && role_id && session?.id) {
      await ensureSheet('indications', ['session_id','role_id','member_id','nominee_id','at']);
      const rows = await readRange('indications!A:E').catch(()=>[]);
      if (rows.length > 1) {
        const [h, ...data] = rows;
        const i = idxMap(h);
        const set = new Set();
        data.forEach(r => {
          if (norm(r[i.role_id]) === role_id && norm(r[i.session_id]) === session.id && norm(r[i.member_id])) {
            set.add(norm(r[i.member_id]));
          }
        });
        indicated_count = set.size;
      }
    }
    const participated_count = stage === 'voting' ? voted_count : (stage === 'indication' ? indicated_count : 0);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ministry_id, role_id, ministry_name, role_name,
        stage,
        indication_active: stage === 'indication',
        voting_active: stage === 'voting',
        total_members,
        logged_count, // <-- sem fallback para total_members
        voted_count, indicated_count, participated_count,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (e) {
    console.error('status error:', e);
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: e.message }) };
  }
};
