// netlify/functions/status.js
// =============================================================
// Retorna o andamento da sessão ativa para o painel técnico.
// Abas usadas (criadas automaticamente por utils/google.js):
//  - sessions:    id | status | ministry_id | role_id | stage | updated_at
//  - ministries:  id | name
//  - roles:       id | name | ministry_id
//  - members:     id | name | photo_url | active
//  - indications: session_id | role_id | member_id | nominee_id | at
//  - votes:       session_id | role_id | member_id | nominee_id | at
//  - presence:    member_id | name | last_seen
// =============================================================

import { readRange } from './utils/google.js';

function idxMap(headerRow = []) {
  return Object.fromEntries(headerRow.map((h, i) => [String(h), i]));
}

function truthy(v) {
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'sim' || s === 'yes' || s === 'y';
}

export const handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: '',
      };
    }

    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // ------------------------------------------------------------------
    // 1) Sessão ativa (última linha da aba sessions)
    // ------------------------------------------------------------------
    const sessions = await readRange('sessions!A:F');
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

    // ------------------------------------------------------------------
    // 2) Resolução de nomes (ministério/cargo)
    // ------------------------------------------------------------------
    const ministries = await readRange('ministries!A:B');
    const roles = await readRange('roles!A:C');

    let ministry_name = '-';
    let role_name = '-';

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

    // ------------------------------------------------------------------
    // 3) Membros: total ativos (coluna 'active' true/1) = universo
    // ------------------------------------------------------------------
    const membersRows = await readRange('members!A:D');
    let total_members = 0;
    if (membersRows && membersRows.length > 1) {
      const [mh, ...mr] = membersRows;
      const mi = idxMap(mh);
      total_members = mr.filter(r => truthy(r[mi.active])).length;
    }

    // ------------------------------------------------------------------
    // 4) Presença real (últimos 2 minutos)
    // ------------------------------------------------------------------
    let logged_count = total_members;
    try {
      const presRows = await readRange('presence!A:C');
      if (presRows && presRows.length > 1) {
        const [, ...data] = presRows;
        const now = Date.now();
        const cutoff = 2 * 60 * 1000; // 2 minutos
        const active = data.filter(r => {
          const last = new Date(r[2]).getTime();
          return now - last <= cutoff;
        });
        logged_count = active.length;
      }
    } catch (e) {
      // se a aba presence não existir, utils cria na próxima escrita;
      // aqui seguimos com logged_count = total_members
    }

    // ------------------------------------------------------------------
    // 5) Participação na fase atual
    // ------------------------------------------------------------------
    let voted_count = 0;
    let indicated_count = 0;

    if (voting_active && session.role_id && session.id) {
      const votesRows = await readRange('votes!A:E');
      if (votesRows && votesRows.length > 1) {
        const [vh, ...vr] = votesRows;
        const vi = idxMap(vh);
        const set = new Set();
        vr.forEach(r => {
          const sameRole = r[vi.role_id] === session.role_id;
          const sameSess = r[vi.session_id] === session.id;
          const mem = r[vi.member_id];
          if (sameRole && sameSess && mem) set.add(mem);
        });
        voted_count = set.size;
      }
    }

    if (indication_active && session.role_id && session.id) {
      const indRows = await readRange('indications!A:E');
      if (indRows && indRows.length > 1) {
        const [ih, ...ir] = indRows;
        const ii = idxMap(ih);
        const set = new Set();
        ir.forEach(r => {
          const sameRole = r[ii.role_id] === session.role_id;
          const sameSess = r[ii.session_id] === session.id;
          const mem = r[ii.member_id];
          if (sameRole && sameSess && mem) set.add(mem);
        });
        indicated_count = set.size;
      }
    }

    const participated_count = voting_active ? voted_count : (indication_active ? indicated_count : 0);

    // ------------------------------------------------------------------
    // 6) Payload final
    // ------------------------------------------------------------------
    const payload = {
      // Sessão
      ministry_id: session.ministry_id || '',
      role_id: session.role_id || '',
      ministry_name,
      role_name,
      stage: session.stage,                  // "none" | "indication" | "voting"
      indication_active,
      voting_active,
      updated_at: session.updated_at,

      // Métricas
      total_members,                         // membros ativos cadastrados
      logged_count,                          // presença real (últimos 2 min)
      voted_count,                           // qtd membros que já votaram (fase votação)
      indicated_count,                       // qtd membros que já indicaram (fase indicação)
      participated_count,                    // número exibido como "já participaram"

      // Marcação de tempo
      timestamp: new Date().toISOString(),
    };

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(payload),
    };
  } catch (e) {
    console.error('Erro API /status:', e);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message }),
    };
  }
};
