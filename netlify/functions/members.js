import { driveClient, readRange, writeRange } from './utils/google.js';

export const handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const rows = await readRange('members!A:D');
      const [h,...d]=rows || []; if(!h) return {statusCode:200, body:'[]'};
      const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
      const out = d.map(r=>({ id:r[idx.id], name:r[idx.name], photo_url:r[idx.photo_url], active:String(r[idx.active])==='1' }));
      return { statusCode:200, body: JSON.stringify(out) };
    }
    if (event.httpMethod === 'POST') { // sync from Drive folder
      const drive = await driveClient();
      const folderId = process.env.DRIVE_MEMBERS_FOLDER_ID;
      if (!folderId) return { statusCode:400, body:'DRIVE_MEMBERS_FOLDER_ID is required' };
      const { data } = await drive.files.list({ q: `'${folderId}' in parents and trashed=false`, fields: 'files(id,name,webContentLink,thumbnailLink,webViewLink)' });
      const header = ['id','name','photo_url','active'];
      const rows = [header, ...(data.files || []).map(f=>[ `mem_${f.id}`, f.name.replace(/\.[^.]+$/,''), `https://drive.google.com/uc?id=${f.id}`, '1' ])];
      await writeRange('members!A1', rows);
      return { statusCode:200, body: JSON.stringify({ count: (data.files||[]).length }) };
    }
    return { statusCode:405, body:'Method Not Allowed' };
  } catch(e){
    return { statusCode:500, body: JSON.stringify({ error:e.message }) };
  }
}