// netlify/functions/utils/google.js
// =======================================================================
// Utilitários para Google Sheets com auto-criação de abas e cabeçalhos.
// - Se a aba não existir: criamos via batchUpdate (AddSheet)
// - Se a aba existir e estiver vazia: escrevemos cabeçalho
// - readRange / appendRange se tornam "tolerantes" a abas ausentes
// Requer env:
//   GOOGLE_CLIENT_EMAIL
//   GOOGLE_PRIVATE_KEY_BASE64  (chave privada em Base64)
//   SHEETS_SPREADSHEET_ID
// =======================================================================

import { google } from 'googleapis';

// Mapeia cabeçalhos padrão por aba (você pode ajustar/add conforme suas abas)
const DEFAULT_HEADERS = {
  members:     ['id','name','photo_url','active'],
  ministries:  ['id','name'],
  roles:       ['id','name','ministry_id'],
  indications: ['session_id','role_id','member_id','nominee_id','at'],
  votes:       ['session_id','role_id','member_id','nominee_id','at'],
  sessions:    ['id','status','ministry_id','role_id','stage','updated_at'],
  health:      ['at','ok'],
};

function getEnv(name, required = true) {
  const v = process.env[name];
  if (!v && required) throw new Error(`Missing env: ${name}`);
  return v;
}

function decodePrivateKey() {
  const b64 = getEnv('GOOGLE_PRIVATE_KEY_BASE64');
  const raw = Buffer.from(b64, 'base64').toString('utf8');
  return raw;
}

function authClient() {
  const clientEmail = getEnv('GOOGLE_CLIENT_EMAIL');
  const privateKey  = decodePrivateKey();
  const jwt = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return jwt;
}

function sheetsApi() {
  const auth = authClient();
  return google.sheets({ version: 'v4', auth });
}

export function nowISO() {
  return new Date().toISOString();
}

// Extrai o nome da aba a partir de um range "aba!A:B"
function extractSheetTitle(rangeA1) {
  const idx = rangeA1.indexOf('!');
  if (idx === -1) {
    // se não tiver '!', consideramos tudo como título (raro)
    return rangeA1.replace(/['"]/g, '');
  }
  return rangeA1.substring(0, idx).replace(/['"]/g, '');
}

// Verifica se aba existe
async function sheetExists(sheets, spreadsheetId, title) {
  const res = await sheets.spreadsheets.get({ spreadsheetId });
  const list = res.data.sheets || [];
  return list.some(s => s.properties && s.properties.title === title);
}

// Cria aba (AddSheet)
async function createSheet(sheets, spreadsheetId, title) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        { addSheet: { properties: { title } } }
      ]
    }
  });
}

// Escreve cabeçalho na primeira linha (A1, B1, ...)
async function writeHeader(sheets, spreadsheetId, title, headers) {
  const range = `${title}!A1:${String.fromCharCode(64 + headers.length)}1`;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values: [headers] }
  });
}

// Verifica se a planilha (aba) existe e tem cabeçalho; se não, cria e/ou escreve
async function ensureSheetAndHeader(title) {
  const spreadsheetId = getEnv('SHEETS_SPREADSHEET_ID');
  const headers = DEFAULT_HEADERS[title]; // pode ser undefined se não mapeado
  const sheets = sheetsApi();

  const exists = await sheetExists(sheets, spreadsheetId, title);
  if (!exists) {
    await createSheet(sheets, spreadsheetId, title);
    if (headers && headers.length) {
      await writeHeader(sheets, spreadsheetId, title, headers);
    }
    return;
  }

  // Se existe, mas queremos garantir cabeçalho quando definido no DEFAULT_HEADERS:
  if (headers && headers.length) {
    const range = `${title}!A1:${String.fromCharCode(64 + headers.length)}1`;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId, range
    }).catch(() => null);
    const values = res?.data?.values;
    if (!values || !values.length) {
      // não há cabeçalho, escrever
      await writeHeader(sheets, spreadsheetId, title, headers);
    }
  }
}

// Leitura tolerante: se aba não existir, cria; se tiver header default, já grava
export async function readRange(rangeA1) {
  const spreadsheetId = getEnv('SHEETS_SPREADSHEET_ID');
  const title = extractSheetTitle(rangeA1);
  const sheets = sheetsApi();

  // Garante aba/cabeçalho se mapeado
  await ensureSheetAndHeader(title);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: rangeA1,
  }).catch(async (e) => {
    const msg = String(e?.message || '');
    if (/Unable to parse range/i.test(msg)) {
      // tenta criar e ler novamente
      await ensureSheetAndHeader(title);
      return await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: rangeA1,
      });
    }
    throw e;
  });

  return res.data.values || [];
}

// Escrita de intervalo (substitui valores)
export async function writeRange(rangeA1, values) {
  const spreadsheetId = getEnv('SHEETS_SPREADSHEET_ID');
  const title = extractSheetTitle(rangeA1);
  const sheets = sheetsApi();

  await ensureSheetAndHeader(title);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: rangeA1,
    valueInputOption: 'RAW',
    requestBody: { values }
  });
}

// Append tolerante: se aba não existir, cria; respeita cabeçalho se houver default
export async function appendRange(rangeA1, values) {
  const spreadsheetId = getEnv('SHEETS_SPREADSHEET_ID');
  const title = extractSheetTitle(rangeA1);
  const sheets = sheetsApi();

  await ensureSheetAndHeader(title);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: rangeA1,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values }
  });
}
