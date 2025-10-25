// netlify/functions/status.js
// =============================================================
// Retorna o andamento da votação ativa (para o painel técnico)
// =============================================================

import { readRange } from './utils/google.js';

export const handler = async (event) => {
  try {
    const method = event.httpMethod;

    if (method === 'OPTIONS') {
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

    // =========================================================
    // GET → busca o status atual
    // =========================================================
    if (method === 'GET') {
      // lê ministérios e cargos ativos (para mostrar nome)
      const ministries = await readRange('ministries!A:B');
      const roles = await readRange('roles!A:C');
      const members = await readRange('members!A:C');
      const votes = await readRange('votes!A:E');

      // ---------------------------------------------------------
      // LOCALIZA A VOTAÇÃO ATIVA
      // ---------------------------------------------------------
      // No futuro podemos usar a aba sessions. Por enquanto, usa a última votação existente.
      let activeRoleId = null;
      let activeRoleName = null;
      let activeMinName = null;

      if (roles && roles.length > 1) {
        const last = roles[roles.length - 1];
        activeRoleId = last[0];
        activeRoleName = last[1];
        const minRow = ministries.find((m) => m[0] === last[2]);
        activeMinName = minRow ? minRow[1] : '';
      }

      // ---------------------------------------------------------
      // CALCULA MEMBROS LOGADOS E QUE JÁ VOTARAM
      // ---------------------------------------------------------
      const totalMembers = (members || []).filter(
        (m) => String(m[2]) === '1' || String(m[2]).toLowerCase() === 'true'
      ).length;

      const votedMembers = new Set();
      if (votes && votes.length > 1) {
        const header = votes[0];
        const idx = Object.fromEntries(header.map((x, i) => [x, i]));
        for (let i = 1; i < votes.length; i++) {
          const row = votes[i];
          const member_id = row[idx.member_id];
          const role_id = row[idx.role_id];
          if (member_id && role_id === activeRoleId) votedMembers.add(member_id);
        }
      }

      const voted_count = votedMembers.size;

      const status = {
        ministry_name: activeMinName || '-',
        role_name: activeRoleName || '-',
        total_members: totalMembers,
        voted_count,
        timestamp: new Date().toISOString(),
      };

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(status),
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (e) {
    console.error('Erro API /status:', e);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message }),
    };
  }
};
