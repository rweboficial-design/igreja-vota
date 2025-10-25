import React, { useEffect, useState } from 'react'
import useStore from '../store'
import { api } from '../api'

export default function Voting(){
  const { memberId, session } = useStore()
  const [ranking, setRanking] = useState([])
  const [choice, setChoice] = useState('')

  useEffect(()=>{ api(`indication?role_id=${session.role_id}`).then(setRanking) },[session.role_id])

  const submit = async ()=>{
    if(!choice) return;
    await api('voting', { method:'POST', body: JSON.stringify({ role_id: session.role_id, member_id: memberId||'anon', candidate_id: choice }) })
    alert('Voto registrado!')
  }

  return (
    <div>
      <h2>Vote em 1 candidato</h2>
      <ul className="list">
        {ranking.slice(0,10).map(r=> (
          <li key={r.id}>
            <label>
              <input type="radio" name="vote" value={r.id} onChange={()=>setChoice(r.id)} /> {r.id} <small>({r.indications} indicações)</small>
            </label>
          </li>
        ))}
      </ul>
      <div className="actions"><button disabled={!choice} onClick={submit}>Votar</button></div>
    </div>
  )
}