import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function MembersPage(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState('')

  const load = ()=> api('members')
    .then(setItems)
    .catch(e => setError('Falha ao carregar membros: ' + e.message))

  useEffect(load,[])

  const addManual = async ()=>{
    setLoading(true); setError('')
    try{
      if (!name.trim()) { alert('Informe o nome'); return }
      await api('members', { method:'POST', body: JSON.stringify({ name: name.trim(), photo_url: photo.trim(), active: true }) })
      setName(''); setPhoto('')
      await load()
      alert('Membro incluído!')
    }catch(e){
      setError('Falha ao incluir: ' + (e.message || e))
    }finally{
      setLoading(false)
    }
  }

  const syncDrive = async ()=>{
    setLoading(true); setError('')
    try{
      await api('members', { method:'POST', body: JSON.stringify({ sync_drive: true }) })
      await load()
      alert('Sincronização concluída!')
    }catch(e){
      setError('Falha na sincronização: ' + (e.message || e))
    }finally{
      setLoading(false)
    }
  }

  const update = async (id, patch)=>{
    setLoading(true); setError('')
    try{
      await api('members', { method:'PUT', body: JSON.stringify({ id, ...patch }) })
      await load()
    }catch(e){
      setError('Falha ao atualizar: ' + (e.message || e))
    }finally{
      setLoading(false)
    }
  }

  const del = async (id)=>{
    if (!confirm('Remover este membro?')) return
    setLoading(true); setError('')
    try{
      await api('members', { method:'DELETE', body: JSON.stringify({ id }) })
      await load()
    }catch(e){
      setError('Falha ao remover: ' + (e.message || e))
    }finally{
      setLoading(false)
    }
  }

  return (
    <div>
      <h3>Membros</h3>

      <div className="row">
        <input
          value={name}
          onChange={e=>setName(e.target.value)}
          placeholder="Nome do membro"
          style={{flex:1}}
        />
        <input
          value={photo}
          onChange={e=>setPhoto(e.target.value)}
          placeholder="URL da foto (opcional)"
          style={{flex:2}}
        />
        <button onClick={addManual} disabled={loading}>Adicionar</button>
        <button onClick={syncDrive} disabled={loading}>Sincronizar do Drive</button>
      </div>

      {error && <p style={{color:'#ff9b9b'}}>{error}</p>}

      <ul className="grid">
        {items.map(m=> (
          <li key={m.id} className="card" style={{textAlign:'left'}}>
            <div style={{display:'flex', gap:12, alignItems:'center'}}>
              <img src={m.photo_url || '/logo.png'} alt={m.name} style={{width:64, height:64, objectFit:'cover', borderRadius:8}}/>
              <div style={{flex:1}}>
                <input
                  defaultValue={m.name}
                  onBlur={e=>update(m.id, { name: e.target.value })}
                  style={{width:'100%'}}
                />
                <input
                  defaultValue={m.photo_url}
                  onBlur={e=>update(m.id, { photo_url: e.target.value })}
                  placeholder="URL da foto"
                  style={{width:'100%', marginTop:6}}
                />
                <label style={{display:'inline-flex', alignItems:'center', gap:6, marginTop:8}}>
                  <input
                    type="checkbox"
                    defaultChecked={m.active}
                    onChange={e=>update(m.id, { active: e.target.checked })}
                  />
                  Ativo
                </label>
              </div>
              <button onClick={()=>del(m.id)}>Excluir</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
