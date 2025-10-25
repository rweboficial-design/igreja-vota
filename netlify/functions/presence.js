// netlify/functions/presence.js
import { ensureSheet, appendRange, readRange, nowISO } from './utils/google.js';

// Cache em memória para não floodar o Sheets (função "quente")
const lastBeatByMember = new Map(); // member_id -> timestamp(ms)
const THROTTLE_MS = 45_000; // grava no máximo 1x a cada 45s por membro

const norm = (s) => String(s ?? '').trim();
const idxMap = (hdr = []) =>
  Object.fromEntries(hdr.map((h, i) => [norm(h).toLowerCase(), i]));

// Busca o member_id pelo nome (case-insensitive, primeira ocorrência)
async function findMemberIdByName(name) {
  await ensureSheet('members', ['id', 'name', 'photo_url', 'active']);
  const rows = await readRange('members!A:D').catch(() => []);
  if (!rows || rows.length < 2) return null;
  const [h, ...data] = rows;
  const i = idxMap(h);
  const target = norm(name).toLowerCase();
  const row = data.find((r) => norm(r[i.name]).toLowerCase() === target);
  return row ? norm(row[i.id]) : null;
}

// Conta logados “recentes” (últimos X segundos), retornando SET de ids
async function getActiveSet(seconds = 120) {
  await ensureSheet('presence', ['member_id', 'member_name', 'at']);
  const rows = await readRange('presence!A:C').catch(() => []);
  if (!rows || rows.length < 2) return new Set();
  const [, ...data] = rows;
  const now = Date.now();
  const cutoff = now - seconds * 1000;
  const set = new Set();
  data.forEach((r) => {
    const at = new Date(r[2]).getTime();
    const mid = norm(r[0]);
    if (mid && !Number.isNaN(at) && at >= cutoff) set.add(mid);
  });
  return set;
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

    // -------- GET: debug rápido (contagem e lista) -----------
    if (method === 'GET') {
      const active = await getActiveSet(120);
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          active_count: active.size,
          active_members: Array.from(active),
          window_seconds: 120,
        }),
      };
    }

    // -------- POST: heartbeat do membro -----------------------
    if (method !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const body = JSON.parse(event.body || '{}');
    let member_id = norm(body.member_id);
    const member_name = norm(body.name || body.member_name);

    // Se não veio member_id, tentamos resolver pelo nome
    if (!member_id && member_name) {
      member_id = await findMemberIdByName(member_name);
    }

    if (!member_id) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'member_id ou name são obrigatórios (não encontrados).' }),
      };
    }

    // Throttle (não grava se acabou de gravar)
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
