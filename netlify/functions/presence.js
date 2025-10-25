// netlify/functions/presence.js
import { ensureSheet, appendRange, nowISO } from './utils/google.js';

// cache em memória (enquanto a função está "quente"), para não floodar o Sheets
const lastBeatByMember = new Map(); // member_id -> timestamp(ms)
const THROTTLE_MS = 45_000; // grava no máximo 1x a cada 45s por membro

export const handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: '',
      };
    }
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { member_id, member_name } = JSON.parse(event.body || '{}');
    if (!member_id) return { statusCode: 400, body: 'member_id é obrigatório' };

    const now = Date.now();
    const last = lastBeatByMember.get(member_id) || 0;
    if (now - last < THROTTLE_MS) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true, throttled: true }),
      };
    }

    await ensureSheet('presence', ['member_id', 'member_name', 'at']);
    await appendRange('presence!A:C', [[member_id, member_name || '', nowISO()]]);
    lastBeatByMember.set(member_id, now);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true }),
    };
  } catch (e) {
    console.error('presence error:', e);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message }),
    };
  }
};
