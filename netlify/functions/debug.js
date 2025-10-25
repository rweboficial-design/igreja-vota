export const handler = async () => {
  const from_env = !!process.env.GOOGLE_PRIVATE_KEY;
  const from_b64 = !!process.env.GOOGLE_PRIVATE_KEY_BASE64;
  const source_used = from_b64 ? 'base64' : (from_env ? 'env' : 'none');

  return {
    statusCode: 200,
    body: JSON.stringify({
      has_email: !!process.env.GOOGLE_CLIENT_EMAIL,
      has_key: from_b64 || from_env,
      source_used,
      sheet: !!process.env.SHEETS_SPREADSHEET_ID,
      drive_folder: !!process.env.DRIVE_MEMBERS_FOLDER_ID
    })
  }
}
