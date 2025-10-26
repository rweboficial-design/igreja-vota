import React, { useEffect, useState, useMemo } from 'react'
import useStore from '../store'
import { api } from '../api'

export default function Voting(){
  const { memberId, session } = useStore()
  const [ranking, setRanking] = useState([])
  const [members, setMembers] = useState([])
  const [choice, setChoice] = useState('')

  // Busca indicações (ranking)
  useEffect(() => {
    api(`indication?role_id=${session.role_id}`).then(setRanking)
  }, [session.role_id])

  // Busca lista de membros (para converter id -> nome)
  useEffect(() => {
    api('members').then(setMembers)
  }, [])

  // Cria mapa de id -> nome (para lookup rápido)
  const memberNames = useMemo(() => {
    const map = new Map()
    members.forEach(m => {
      const id = m.id || m._id || m.codigo || m.member_id
      if (id) map.set(String(id), m.name || 'Sem nome')
    })
    return map
  }, [members])

  const submit = async () => {
    if (!choice) return
    await api('voting', {
      method: 'POST',
      body: JSON.stringify({
        role_id: session.role_id,
        member_id: memberId || 'anon',
        candidate_id: choice
      })
    })
    alert('Voto registrado!')
  }

  return (
    <div>
      <h2>Vote em 1 candidato</h2>
      <ul className="list">
        {ranking.slice(0,10).map(r => {
          // converte id -> nome, com fallback para o id caso não encontre
          const nome = memberNames.get(String(r.id)) || r.name || r.id
          return (
            <li key={r.id}>
              <label>
                <input
                  type="radio"
                  name="vote"
                  value={r.id}
                  onChange={() => setChoice(r.id)}
                />{' '}
                {nome} <small>({r.indications} indicações)</small>
              </label>
            </li>
          )
        })}
      </ul>
      <div className="actions">
        <button disabled={!choice} onClick={submit}>Votar</button>
      </div>
    </div>
  )
}
