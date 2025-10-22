import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function MembersPage(){
  const [items, setItems] = useState([])
  const load = ()=> api('members').then(setItems)
  useEffect(load,[])
  const sync = async ()=>{ await api('members',{ method:'POST' }); load() }
  return (
    <div>
      <h3>Membros</h3>
      <button onClick={sync}>Sincronizar com Google Drive</button>
      <ul className="grid">
        {items.map(m=> (
          <li key={m.id} className="card">
            <img src={m.photo_url} alt={m.name}/>
            <div>{m.name}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}