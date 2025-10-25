import { google } from 'googleapis';

const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  undefined,
  (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/drive.readonly']
);

export async function sheetsClient() {
  await auth.authorize();
  return google.sheets({ version: 'v4', auth });
}

export async function driveClient() {
  await auth.authorize();
  return google.drive({ version: 'v3', auth });
}

export const SPREADSHEET_ID = '1nLuR_dlQg5GtTsbmwz7FH9LO5rQDk2s9V9HBUR2ZTQQ';
export const MEMBERS_FOLDER_ID = process.env.DRIVE_MEMBERS_FOLDER_ID;

export async function readRange(range) {
  const sheets = await sheetsClient();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range });
  return res.data.values || [];
}

export async function writeRange(range, values, valueInputOption='RAW') {
  const sheets = await sheetsClient();
  return sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption,
    requestBody: { values }
  });
}

export async function appendRange(range, values, valueInputOption='RAW') {
  const sheets = await sheetsClient();
  return sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption,
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values }
  });
}

export function nowISO(){ return new Date().toISOString(); }
