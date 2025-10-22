import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function MinistriesPage(){
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const load = ()=> api('ministries').then(setItems)
  useEffect(load,[])
  const add = async ()=>{ await api('ministries',{ method:'POST', body: JSON.stringify({ name }) }); setName(''); load() }
  const update = async (id, name)=>{ await api('ministries',{ method:'PUT', body: JSON.stringify({ id, name }) }); load() }
  const del = async (id)=>{ await api('ministries',{ method:'DELETE', body: JSON.stringify({ id }) }); load() }
  return (
    <div>
      <h3>Editar Ministérios</h3>
      <div className="row">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome do ministério"/>
        <button onClick={add} disabled={!name}>Incluir</button>
      </div>
      <ul className="list">
        {items.map(it=> (
          <li key={it.id}>
            <input defaultValue={it.name} onBlur={e=>update(it.id, e.target.value)} />
            <button onClick={()=>del(it.id)}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  )
}