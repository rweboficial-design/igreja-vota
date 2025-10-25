import { driveClient, readRange, writeRange, appendRange } from './utils/google.js';

// garante cabeçalho na aba members
async function ensureMembersHeader() {
  const rows = await readRange('members!A:D');
  if (!rows || rows.length === 0) {
    await writeRange('members!A1', [['id','name','photo_url','active']]);
    return true;
  }
  return false;
}

export const handler = async (event) => {
  try {
    const method = event.httpMethod;

    if (method === 'GET') {
      await ensureMembersHeader();
      const rows = await readRange('members!A:D');
      const [h,...d]=rows || []; if(!h) return {statusCode:200, body:'[]'};
      const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
      const out = d
        .filter(r => r && r.length >= 4)
        .map(r=>({ id:r[idx.id], name:r[idx.name], photo_url:r[idx.photo_url], active:String(r[idx.active])==='1' }));
      return { statusCode:200, body: JSON.stringify(out) };
    }

    if (method === 'POST') {
      // Dois modos:
      // 1) { sync_drive: true } -> sincroniza do Drive (modo antigo)
      // 2) { name, photo_url?, active? } -> adiciona um membro manualmente
      const body = JSON.parse(event.body||'{}');

      // Modo 1: sincronizar do Drive (opcional)
      if (body.sync_drive) {
        const folderId = process.env.DRIVE_MEMBERS_FOLDER_ID;
        if (!folderId) return { statusCode:400, body:'DRIVE_MEMBERS_FOLDER_ID is required' };
        const drive = await driveClient();
        const { data } = await drive.files.list({
          q: `'${folderId}' in parents and trashed=false`,
          fields: 'files(id,name)'
        });
        await ensureMembersHeader();
        // lê existentes para evitar duplicar
        const rows = await readRange('members!A:D');
        const ids = new Set((rows.slice(1) || []).map(r => r[0]));
        const toAdd = [];
        (data.files || []).forEach(f=>{
          const id = `mem_${f.id}`;
          if (!ids.has(id)) {
            toAdd.push([ id, f.name.replace(/\.[^.]+$/,''), `https://drive.google.com/uc?id=${f.id}`, '1' ]);
          }
        });
        if (toAdd.length) await appendRange('members!A:D', toAdd);
        return { statusCode:200, body: JSON.stringify({ synced: toAdd.length }) };
      }

      // Modo 2: adicionar manualmente
      const { name, photo_url='', active=true } = body;
      if (!name || !String(name).trim()) {
        return { statusCode:400, body:'name is required' };
      }
      await ensureMembersHeader();
      const id = 'mem_' + Math.random().toString(36).slice(2,8);
      await appendRange('members!A:D', [[ id, String(name).trim(), String(photo_url||''), active ? '1' : '0' ]]);
      return { statusCode:200, body: JSON.stringify({ id, name, photo_url, active }) };
    }

    if (method === 'PUT') {
      // Atualiza um membro
      const { id, name, photo_url, active } = JSON.parse(event.body||'{}');
      if (!id) return { statusCode:400, body:'id is required' };
      const rows = await readRange('members!A:D');
      const [h,...d]=rows || []; if(!h) return { statusCode:404, body:'members sheet missing' };
      const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
      const i = d.findIndex(r=>r[idx.id]===id);
      if (i<0) return { statusCode:404, body:'member not found' };
      if (name !== undefined) d[i][idx.name] = name;
      if (photo_url !== undefined) d[i][idx.photo_url] = photo_url;
      if (active !== undefined) d[i][idx.active] = active ? '1' : '0';
      await writeRange('members!A1', [h, ...d]);
      return { statusCode:200, body: JSON.stringify({ ok:true }) };
    }

    if (method === 'DELETE') {
      // Remove um membro
      const { id } = JSON.parse(event.body||'{}');
      if (!id) return { statusCode:400, body:'id is required' };
      const rows = await readRange('members!A:D');
      const [h,...d]=rows || []; if(!h) return { statusCode:404, body:'members sheet missing' };
      const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
      const filtered = d.filter(r=>r[idx.id]!==id);
      await writeRange('members!A1', [h, ...filtered]);
      return { statusCode:200, body: JSON.stringify({ ok:true }) };
    }

    return { statusCode:405, body:'Method Not Allowed' };
  } catch(e){
    // Retorna texto do erro p/ aparecer no app
    return { statusCode:500, body: JSON.stringify({ error:e.message }) };
  }
}
