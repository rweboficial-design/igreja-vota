// src/member/VotingScreen.jsx
import React, { useMemo, useState } from 'react'
import { api } from '../api'
import useStore from '../store'
import WaitingScreen from './WaitingScreen'
import { useMembersMap } from '../utils/useMembersMap'

export default function VotingScreen() {
  const { session } = useStore()
  const { list: members } = useMembersMap()

  // estado local
  const [selected, setSelected] = useState('')   // id do candidato selecionado
  const [sending, setSending] = useState(false)  // estado de envio
  const [done, setDone] = useState(false)        // após concluir, vai para Aguardar

  // candidatos visíveis — se quiser filtrar por cargo/ministério, ajuste aqui
  const candidates = useMemo(() => {
    return Array.isArray(members) ? members : []
  }, [members])

  const canSend = !!selected && !sending

  const onSelect = (id) => {
    if (sending) return
    setSelected(prev => (prev === id ? '' : id))
  }

  const sendVote = async () => {
    if (!canSend) return
    try {
      setSending(true)
      await api('voting', {
        method: 'POST',
        body: JSON.stringify({
          role_id: session?.role_id,
          ministry_id: session?.ministry_id,
          candidate_id: selected,        // único voto
        }),
      })
      alert('Votação concluída!')
      setDone(true)                      // só depois do popup, muda para Aguardar
    } catch (e) {
      console.error(e)
      alert('Não foi possível enviar seu voto. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  // Depois de votar, envia o usuário pra tela de Aguardar
  if (done) return <WaitingScreen />

  // Se por algum motivo não há lista ainda
  const isEmpty = !candidates || candidates.length === 0

  return (
    <div className="page">
      <h2 className="title">Vote em 1 candidato</h2>

      {isEmpty ? (
        <p style={{ opacity: .8 }}>Carregando candidatos…</p>
      ) : (
        <div className="member-grid">
          {candidates.map((m) => {
            const id = String(m.id)
            const isSel = selected === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className={`member-card ${isSel ? 'member-card--selected' : ''}`}
                aria-pressed={isSel}
                disabled={sending}
              >
                <div className="member-card__photo">
                  {m.photoUrl ? (
                    <img src={m.photoUrl} alt={`Foto de ${m.name}`} />
                  ) : (
                    <div className="member-card__avatar">
                      <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true">
                        <path d="M12 12c2.761 0 5-2.686 5-6s-2.239-6-5-6-5 2.686-5 6 2.239 6 5 6zm0 2c-4.418 0-8 2.91-8 6.5V22h16v-1.5c0-3.59-3.582-6.5-8-6.5z" fill="currentColor"/>
                      </svg>
                    </div>
                  )}
                </div>

                <div className="member-card__name" title={m.name}>
                  {m.name}
                </div>

                {isSel && (
                  <div style={{ color: '#16a34a', fontWeight: 700, fontSize: 13 }}>
                    Selecionado
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      <div className="actions">
        <button
          onClick={sendVote}
          className="btn-primary"
          disabled={!canSend}
        >
          {sending ? 'Enviando…' : 'Enviar voto'}
        </button>
      </div>
    </div>
  )
}
