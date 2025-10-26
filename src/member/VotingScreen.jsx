// src/member/VotingScreen.jsx
import React, { useMemo, useState } from 'react'
import { api } from '../api'
import useStore from '../store'
import WaitingScreen from './WaitingScreen'
import { useMembersMap } from '../utils/useMembersMap'

export default function VotingScreen() {
  const { session } = useStore()
  const { list: members } = useMembersMap()

  const [selected, setSelected] = useState('')   // um único voto
  const [sending, setSending] = useState(false)  // estado de envio
  const [done, setDone] = useState(false)        // após concluir, vai para Aguardar

  // lista de candidatos (por cargo atual). Ajuste o filtro se necessário.
  const candidates = useMemo(() => {
    // Se você tiver uma lista de indicados no backend, troque para buscá-la.
    // Aqui usamos todos por simplicidade.
    return members
  }, [members])

  const canSend = !!selected && !sending

  const sendVote = async () => {
    if (!canSend) return
    try {
      setSending(true)
      await api('voting', {
        method: 'POST',
        body: JSON.stringify({
          role_id: session?.role_id,
          ministry_id: session?.ministry_id,
          candidate_id: selected,
        }),
      })
      alert('Votação concluída!')
      setDone(true) // só depois do popup, muda para Aguardar
    } catch (e) {
      console.error(e)
      alert('Não foi possível enviar seu voto. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  if (done) return <WaitingScreen />

  return (
    <div style={{ padding: 16 }}>
      <h2>Votação</h2>
      <p style={{ color: '#9ca3af' }}>Escolha 1 candidato e envie seu voto.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
        {candidates.map(m => {
          const isSel = selected === String(m.id)
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => !sending && setSelected(String(m.id))}
              disabled={sending}
              className={`member-card ${isSel ? 'member-card--selected' : ''}`}
              style={{
                textAlign: 'left',
                padding: 10,
                border: isSel ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,.12)',
                borderRadius: 12,
                opacity: sending ? 0.6 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 999,
                  background: 'rgba(255,255,255,.08)', display: 'grid', placeItems: 'center',
                  overflow: 'hidden'
                }}>
                  {m.photoUrl
                    ? <img src={m.photoUrl} alt={`Foto de ${m.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontWeight: 700 }}>{(m.name || '').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase()}</span>
                  }
                </div>
                <div style={{ display: 'grid' }}>
                  <strong>{m.name}</strong>
                  <span style={{ color: '#9ca3af', fontSize: 12 }}>ID: {m.id}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          onClick={sendVote}
          disabled={!canSend}
        >
          {sending ? 'Enviando…' : 'Enviar voto'}
        </button>
      </div>
    </div>
  )
}
