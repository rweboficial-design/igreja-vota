export const handler = async () => {
  const email = process.env.GOOGLE_CLIENT_EMAIL || ''
  const key = process.env.GOOGLE_PRIVATE_KEY || ''
  const sheet = process.env.SHEETS_SPREADSHEET_ID || ''
  const drive = process.env.DRIVE_MEMBERS_FOLDER_ID || ''

  return {
    statusCode: 200,
    body: JSON.stringify({
      has_email: Boolean(email),
      has_key: Boolean(key && key.length > 50),
      sheet: Boolean(sheet),
      drive_folder: Boolean(drive)
    })
  }
}
