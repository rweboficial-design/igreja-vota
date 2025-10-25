// netlify/functions/ministries.js
import { readRange, writeRange, appendRange, nowISO } from './utils/google.js';

function norm(s) {
  return String(s || '').trim();
}
function idxMap(headerRow = []) {
  const out = {};
  headerRow.forEach((h, i) => {
    const k = norm(h).toLowerCase(); // case-insensitive
    out[k] = i;
  });
  return out;
}

// Garante cabeçalho mínimo
async function ensureHeader() {
  // utils/google.js já cria a aba e cabeçalho padrão se não existirem,
  // mas aqui reforçamos para ter colunas extras se for preciso.
  const rows = await readRange('ministries!A:D').catch(() => null);
  const hasHeader = rows && rows.length > 0;
  if (!hasHeader) {
    await writeRange('ministries!A1:D1', [['id', 'name', 'created_at', 'updated_at']]);
  }
}

// Lista todos
async function listAll() {
  await ensureHeader();
  const rows = await readRange('ministries!A:D');
  if (!rows || rows.length < 2) return [];
  const [h, ...data] = rows;
  const idx = idxMap(h);
  const out = data
    .filter(r => norm(r[idx.id])) // só linhas com id
    .map(r => ({
      id: norm(r[idx.id]),
      name: norm(r[idx.name]),
      created_at: r[idx.created_at] || '',
      updated_at: r[idx.updated_at] || '',
    }));
  return out;
}

function newId() {
  // id curto: min_xxxxxx
  return 'min_' + Math.random().toString(36).slice(2, 8);
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
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: '',
      };
    }

    if (method === 'GET') {
      const list = await listAll();
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(list),
      };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const name = norm(body.name);
      if (!name) return { statusCode: 400, body: 'name é obrigatório' };

      await ensureHeader();
      const id = newId();
      const now = nowISO();
      await appendRange('ministries!A:D', [[id, name, now, now]]);
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true, id, name }),
      };
    }

    if (method === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const id = norm(body.id);
      const name = norm(body.name);
      if (!id) return { statusCode: 400, body: 'id é obrigatório' };
      if (!name) return { statusCode: 400, body: 'name é obrigatório' };

      const rows = await readRange('ministries!A:D');
      const [h, ...data] = rows || [[]];
      const idx = idxMap(h);
      const rowIndex = data.findIndex(r => norm(r[idx.id]) === id);
      if (rowIndex < 0) return { statusCode: 404, body: 'Ministério não encontrado' };

      const excelRow = rowIndex + 2; // +1 header, +1 base 1
      const createdAt = data[rowIndex][idx.created_at] || nowISO();
      const now = nowISO();
      await writeRange(`ministries!A${excelRow}:D${excelRow}`, [[id, name, createdAt, now]]);
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true }),
      };
    }

    if (method === 'DELETE') {
      // "Excluir" sobrescrevendo a linha com vazio (simples e funciona)
      const body = JSON.parse(event.body || '{}');
      const id = norm(body.id);
      if (!id) return { statusCode: 400, body: 'id é obrigatório' };

      const rows = await readRange('ministries!A:D');
      const [h, ...data] = rows || [[]];
      const idx = idxMap(h);
      const rowIndex = data.findIndex(r => norm(r[idx.id]) === id);
      if (rowIndex < 0) return { statusCode: 404, body: 'Ministério não encontrado' };

      const excelRow = rowIndex + 2;
      // escreve linha em branco (mantém cabeçalho, evita reordenar tudo)
      await writeRange(`ministries!A${excelRow}:D${excelRow}`, [['', '', '', '']]);
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true }),
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (e) {
    console.error('ministries error:', e);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message }),
    };
  }
};
