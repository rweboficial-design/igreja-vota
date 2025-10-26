// src/member/IndicationScreen.jsx
import React, { useMemo, useState } from 'react'
import { api } from '../api'
import useStore from '../store'
import WaitingScreen from './WaitingScreen'
import { useMembersMap } from '../utils/useMembersMap'

export default function IndicationScreen() {
  const { session } = useStore()
  const { list: members } = useMembersMap()

  const [selected, setSelected] = useState([])   // IDs selecionados (máx. 3)
  const [sending, setSending] = useState(false)  // estado de envio
  const [done, setDone] = useState(false)        // após enviar, vai para Aguardar

  // Lista de candidatos (se precisar, filtre por role/ministry)
  const candidates = useMemo(() => {
    return Array.isArray(members) ? members : []
  }, [members])

  // alterna seleção (até 3)
  const toggle = (id) => {
    if (sending) return
    setSelected(prev => {
      const sid = String(id)
      if (prev.includes(sid)) return prev.filter(x => x !== sid)
      if (prev.length >= 3) return prev
      return [...prev, sid]
    })
  }

  const canSend = selected.length > 0 && selected.length <= 3 && !sending

  const sendIndication = async () => {
    if (!canSend) return
    try {
      setSending(true)
      await api('indication', {
        method: 'POST',
        body: JSON.stringify({
          role_id: session?.role_id,
          ministry_id: session?.ministry_id,
          nominees: selected, // array de IDs
        }),
      })
      alert('Indicação concluída!')
      setDone(true) // só depois do popup vai para Aguardar
    } catch (e) {
      console.error(e)
      alert('Não foi possível enviar sua indicação. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  if (done) return <WaitingScreen />

  return (
    <div className="page">
      <h2 className="title">Indique até 3 membros</h2>

      <div className="member-grid">
        {candidates.map((m) => {
          const id = String(m.id)
          const isSel = selected.includes(id)

          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={`member-card ${isSel ? 'member-card--selected' : ''}`}
              aria-pressed={isSel}
              disabled={sending}
            >
              <div className="member-card__photo">
                {m.photoUrl ? (
                  <img src={m.photoUrl} alt={`Foto de ${m.name}`} />
                ) : (
                  <div className="member-card__avatar">
                    {/* Ícone pessoa (lilás) */}
                    <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true">
                      <path d="M12 12c2.761 0 5-2.686 5-6s-2.239-6-5-6-5 2.686-5 6 2.239 6 5 6zm0 2c-4.418 0-8 2.91-8 6.5V22h16v-1.5c0-3.59-3.582-6.5-8-6.5z" fill="currentColor"/>
                    </svg>
                  </div>
                )}
              </div>

              <div className="member-card__name" title={m.name}>
                {m.name}
              </div>
            </button>
          )
        })}
      </div>

      <div className="actions">
        <button
          onClick={sendIndication}
          className="btn-primary"
          disabled={!canSend}
        >
          {sending ? 'Enviando…' : `Enviar indicação${selected.length > 1 ? 's' : ''} (${selected.length}/3)`}
        </button>
      </div>
    </div>
  )
}
