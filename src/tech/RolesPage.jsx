import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function RolesPage(){
  const [items, setItems] = useState([])
  const [mins, setMins] = useState([])
  const [min, setMin] = useState('')
  const [name, setName] = useState('')
  const load = ()=> { api('roles').then(setItems); api('ministries').then(setMins) }
  useEffect(load,[])
  const add = async ()=>{ await api('roles',{ method:'POST', body: JSON.stringify({ ministry_id:min, name }) }); setName(''); load() }
  const update = async (id, name)=>{ await api('roles',{ method:'PUT', body: JSON.stringify({ id, name }) }); load() }
  const del = async (id)=>{ await api('roles',{ method:'DELETE', body: JSON.stringify({ id }) }); load() }
  return (
    <div>
      <h3>Editar Cargos</h3>
      <div className="row">
        <select value={min} onChange={e=>setMin(e.target.value)}>
          <option value="">Selecione o ministério…</option>
          {mins.map(m=> <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome do cargo"/>
        <button onClick={add} disabled={!min||!name}>Incluir</button>
      </div>
      <ul className="list">
        {items.filter(r=>!min || r.ministry_id===min).map(it=> (
          <li key={it.id}>
            <span className="tag">{it.ministry_id}</span>
            <input defaultValue={it.name} onBlur={e=>update(it.id, e.target.value)} />
            <button onClick={()=>del(it.id)}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  )
}