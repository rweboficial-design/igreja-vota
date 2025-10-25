// netlify/functions/save_results.js
// Esta Function recebe um payload com os resultados já agrupados
// e grava uma linha por candidato em uma aba do Google Sheets.
//
// Requer que o util 'utils/google.js' já esteja configurado do mesmo
// jeito que as outras Functions (members, votes, etc).

import { sheets } from './utils/google.js'; 
// Se o seu utils exporta de forma diferente, ajuste para:
// import * as sheets from './utils/google.js';

const SHEET_NAME = 'results_history'; // nome da nova aba

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const body = JSON.parse(event.body || '{}');

    // Esperamos um array "rows" (flatten) OU um array "groups" (estruturado)
    // Formato groups esperado (o mesmo da Results.jsx):
    // groups: [{ ministryId, ministryName, roleId, roleName, rows: [{id, name, count}] }]
    const { groups = [], rows = [], requested_by = 'anon' } = body;

    // Garante a aba e cabeçalhos
    await sheets.ensureSheet(
      SHEET_NAME,
      [
        'timestamp',
        'requested_by',
        'ministry_id',
        'ministry_name',
        'role_id',
        'role_name',
        'candidate_id',
        'candidate_name',
        'count',
      ]
    );

    // Monta linhas para inserir
    const now = new Date().toISOString();
    let toInsert = [];

    if (groups.length) {
      for (const g of groups) {
        const { ministryId, ministryName, roleId, roleName, rows: candidates = [] } = g || {};
        for (const c of candidates) {
          toInsert.push([
            now,
            requested_by,
            String(ministryId ?? ''),
            String(ministryName ?? ''),
            String(roleId ?? ''),
            String(roleName ?? ''),
            String(c.id ?? ''),
            String(c.name ?? ''),
            Number(c.count ?? 0),
          ]);
        }
      }
    } else if (rows.length) {
      // Caso a página envie já “achatado”
      for (const r of rows) {
        toInsert.push([
          now,
          requested_by,
          String(r.ministryId ?? ''),
          String(r.ministryName ?? ''),
          String(r.roleId ?? ''),
          String(r.roleName ?? ''),
          String(r.candidateId ?? r.id ?? ''),
          String(r.candidateName ?? r.name ?? ''),
          Number(r.count ?? 0),
        ]);
      }
    } else {
      return { statusCode: 400, body: 'Payload vazio: envie { groups: [...] } ou { rows: [...] }' };
    }

    if (!toInsert.length) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, inserted: 0 }) };
    }

    await sheets.appendRows(SHEET_NAME, toInsert);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, inserted: toInsert.length }),
    };
  } catch (err) {
    console.error('save_results error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err?.message || err) }),
    };
  }
};
