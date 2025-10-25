import React, { useEffect, useState } from 'react'
import useStore from '../store'
import { api } from '../api'

export default function Indication(){
  const { memberId, session } = useStore()
  const [members, setMembers] = useState([])
  const [picked, setPicked] = useState([])

  useEffect(()=>{ api('members').then(setMembers) },[])

  const toggle = (id)=>{
    setPicked(p=> p.includes(id) ? p.filter(x=>x!==id) : (p.length<3 ? [...p,id] : p))
  }

  const submit = async ()=>{
    await api('indication', { method:'POST', body: JSON.stringify({ role_id: session.role_id, member_id: memberId||'anon', nominee_ids: picked }) })
    alert('Indicações enviadas!')
  }

  return (
    <div>
      <h2>Indique até 3 pessoas</h2>
      <div className="grid">
        {members.map(m=> (
          <button key={m.id} className={picked.includes(m.id)?'card picked':'card'} onClick={()=>toggle(m.id)}>
            <img src={m.photo_url} alt={m.name}/>
            <div>{m.name}</div>
          </button>
        ))}
      </div>
      <div className="actions">
        <button disabled={!picked.length} onClick={submit}>Indicar</button>
      </div>
    </div>
  )
}