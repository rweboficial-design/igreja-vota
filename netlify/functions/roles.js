// netlify/functions/roles.js
import { readRange, writeRange, appendRange, nowISO } from './utils/google.js';

function norm(s) { return String(s || '').trim(); }
function idxMap(headerRow = []) {
  const out = {};
  headerRow.forEach((h, i) => { out[norm(h).toLowerCase()] = i; });
  return out;
}

async function ensureHeader() {
  const rows = await readRange('roles!A:D').catch(() => null);
  if (!rows || rows.length === 0) {
    await writeRange('roles!A1:D1', [['id','name','ministry_id','updated_at']]);
  }
}

async function listAll() {
  await ensureHeader();
  const rows = await readRange('roles!A:D');
  if (!rows || rows.length < 2) return [];
  const [h, ...data] = rows;
  const idx = idxMap(h);
  return data
    .filter(r => norm(r[idx.id]))
    .map(r => ({
      id: norm(r[idx.id]),
      name: norm(r[idx.name]),
      ministry_id: norm(r[idx.ministry_id]),
      updated_at: r[idx.updated_at] || '',
    }));
}

function newId() { return 'rol_' + Math.random().toString(36).slice(2,8); }

export const handler = async (event) => {
  try {
    const method = event.httpMethod;

    if (method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: '',
      };
    }

    if (method === 'GET') {
      const list = await listAll();
      return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(list) };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const name = norm(body.name);
      const ministry_id = norm(body.ministry_id);
      if (!name) return { statusCode: 400, body: 'name é obrigatório' };
      if (!ministry_id) return { statusCode: 400, body: 'ministry_id é obrigatório' };
      await ensureHeader();
      const id = newId();
      await appendRange('roles!A:D', [[id, name, ministry_id, nowISO()]]);
      return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: true, id }) };
    }

    if (method === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const id = norm(body.id);
      const name = norm(body.name);
      const ministry_id = norm(body.ministry_id);
      if (!id) return { statusCode: 400, body: 'id é obrigatório' };
      if (!name) return { statusCode: 400, body: 'name é obrigatório' };
      if (!ministry_id) return { statusCode: 400, body: 'ministry_id é obrigatório' };

      const rows = await readRange('roles!A:D');
      const [h, ...data] = rows || [[]];
      const idx = idxMap(h);
      const rowIndex = data.findIndex(r => norm(r[idx.id]) === id);
      if (rowIndex < 0) return { statusCode: 404, body: 'Cargo não encontrado' };
      const excelRow = rowIndex + 2;
      await writeRange(`roles!A${excelRow}:D${excelRow}`, [[id, name, ministry_id, nowISO()]]);
      return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: true }) };
    }

    if (method === 'DELETE') {
      const body = JSON.parse(event.body || '{}');
      const id = norm(body.id);
      if (!id) return { statusCode: 400, body: 'id é obrigatório' };

      const rows = await readRange('roles!A:D');
      const [h, ...data] = rows || [[]];
      const idx = idxMap(h);
      const rowIndex = data.findIndex(r => norm(r[idx.id]) === id);
      if (rowIndex < 0) return { statusCode: 404, body: 'Cargo não encontrado' };
      const excelRow = rowIndex + 2;
      await writeRange(`roles!A${excelRow}:D${excelRow}`, [['','','','']]);
      return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (e) {
    console.error('roles error:', e);
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: e.message }) };
  }
};
