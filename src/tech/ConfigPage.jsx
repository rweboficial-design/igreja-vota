import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function ConfigPage(){
  const [cfg, setCfg] = useState({})
  const load = ()=> api('config').then(setCfg)
  useEffect(load,[])
  const save= async ()=>{ await api('config',{ method:'POST', body: JSON.stringify(cfg) }); alert('Config salva!') }
  return (
    <div>
      <h3>Dados</h3>
      <label>Spreadsheet ID <input value={cfg.sheet_id||''} onChange={e=>setCfg({...cfg, sheet_id:e.target.value})} placeholder="SHEETS_SPREADSHEET_ID"/></label>
      <label>Drive Members Folder ID <input value={cfg.drive_folder_id||''} onChange={e=>setCfg({...cfg, drive_folder_id:e.target.value})} placeholder="DRIVE_MEMBERS_FOLDER_ID"/></label>
      <div className="actions"><button onClick={save}>Salvar</button></div>
    </div>
  )
}