// netlify/functions/session.js
// Controla a sessão global (qual fase está ativa) na aba "sessions".
// Colunas: id | status | ministry_id | role_id | stage | updated_at

import { readRange, appendRange, nowISO, writeRange } from './utils/google.js';

function newSessionId() {
  return 'sess_' + Date.now();
}

// Pega a última linha (consideramos a mais recente como "ativa")
async function getLastSession() {
  const rows = await readRange('sessions!A:F'); // com auto-criação via utils
  const [h, ...d] = rows || [];
  if (!h || d.length === 0) return null;
  const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
  const last = d[d.length - 1];
  return {
    id: last[idx.id],
    status: last[idx.status],
    ministry_id: last[idx.ministry_id],
    role_id: last[idx.role_id],
    stage: last[idx.stage],
    updated_at: last[idx.updated_at],
  };
}

export const handler = async (event) => {
  try {
    const method = event.httpMethod;

    // CORS
    if (method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: '',
      };
    }

    if (method === 'GET') {
      const last = await getLastSession();
      // Resposta padrão quando ainda não há sessão
      const payload = last || {
        id: null,
        status: 'closed',
        ministry_id: '',
        role_id: '',
        stage: 'none',
        updated_at: null,
      };

      // Campos auxiliares para o painel
      payload.indication_active = payload.stage === 'indication';
      payload.voting_active = payload.stage === 'voting';

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(payload),
      };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { ministry_id = '', role_id = '', stage = 'none' } = body;

      if (!['none','indication','voting'].includes(stage)) {
        return { statusCode: 400, body: 'stage inválido' };
      }

      const id = newSessionId();
      const now = nowISO();
      const row = [[ id, 'open', ministry_id, role_id, stage, now ]];
      await appendRange('sessions!A:F', row);

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true, id, stage }),
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (e) {
    console.error('Erro /session:', e);
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: e.message }) };
  }
};
