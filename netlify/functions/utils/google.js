// netlify/functions/utils/google.js
import { google } from 'googleapis';

// Lê env de forma tolerante: GOOGLE_PRIVATE_KEY (com \n) ou GOOGLE_PRIVATE_KEY_BASE64
function loadPrivateKey() {
  const b64 = process.env.GOOGLE_PRIVATE_KEY_BASE64;
  if (b64) {
    const buff = Buffer.from(b64, 'base64');
    return buff.toString('utf8');
  }
  let key = process.env.GOOGLE_PRIVATE_KEY || '';
  // aceita tanto com \n literal quanto já em múltiplas linhas
  key = key.replace(/\\n/g, '\n');
  return key;
}

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: loadPrivateKey(),
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.readonly',
  ],
});

const sheets = google.sheets({ version: 'v4', auth });

export function nowISO() {
  return new Date().toISOString();
}

// Retries simples para fugir de quota momentânea
async function withRetry(fn, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      await new Promise(r => setTimeout(r, 250 * (i + 1)));
    }
  }
  throw last;
}

const SPREADSHEET_ID = process.env.SHEETS_SPREADSHEET_ID;

// Lê um intervalo (ex.: "members!A:D")
export async function readRange(a1) {
  return withRetry(async () => {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: a1,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });
    return res.data.values || [];
  });
}

// Escreve um intervalo (substitui)
export async function writeRange(a1, values) {
  return withRetry(async () => {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: a1,
      valueInputOption: 'RAW',
      requestBody: { values },
    });
    return true;
  });
}

// Acrescenta linhas ao final
export async function appendRange(a1, values) {
  return withRetry(async () => {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: a1,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });
    return true;
  });
}

// Garante aba+cabeçalhos
export async function ensureSheet(tabName, headers) {
  // Tenta ler a primeira linha
  try {
    const rows = await readRange(`${tabName}!1:1`);
    if (rows && rows[0] && rows[0].length >= headers.length) return;
  } catch { /* vai tentar criar a aba */ }

  // Pega metadados da planilha
  const meta = await withRetry(() =>
    sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  );
  const sheet = (meta.data.sheets || []).find(
    s => s.properties && s.properties.title === tabName
  );

  if (!sheet) {
    // cria a aba
    await withRetry(() =>
      sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: tabName } } }],
        },
      })
    );
  }

  // escreve cabeçalhos
  await writeRange(`${tabName}!A1:${String.fromCharCode(64 + headers.length)}1`, [headers]);
}
