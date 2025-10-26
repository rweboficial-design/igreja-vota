import React, { useMemo, useState } from 'react'
import { api } from '../api'
import useStore from '../store'
import WaitingScreen from './WaitingScreen'
import { useMembersMap } from '../utils/useMembersMap'

export default function IndicationScreen() {
  const { session } = useStore()
  const { list: members } = useMembersMap()

  const [selected, setSelected] = useState([])
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const candidates = useMemo(() => {
    if (!Array.isArray(members)) return []
    return members
  }, [members])

  const toggle = (id) => {
    if (sending) return
    setSelected((prev) => {
      const sid = String(id)
      if (prev.includes(sid)) return prev.filter((x) => x !== sid)
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
          nominees: selected,
        }),
      })
      alert('Indicação concluída!')
      setDone(true)
    } catch (e) {
      console.error(e)
      alert('Erro ao enviar sua indicação. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  if (done) return <WaitingScreen />

  const isEmpty = !candidates || candidates.length === 0

  return (
    <div className="page">
      <h2 className="title">Indique até 3 membros</h2>

      {isEmpty ? (
        <p style={{ opacity: 0.8 }}>Carregando membros...</p>
      ) : (
        <div className="member-list">
          {candidates.map((m) => {
            const id = String(m.id)
            const isSel = selected.includes(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className={`member-name ${isSel ? 'selected' : ''}`}
                disabled={sending}
              >
                {m.name}
              </button>
            )
          })}
        </div>
      )}

      <div className="actions">
        <button
          onClick={sendIndication}
          className="btn-primary"
          disabled={!canSend}
        >
          {sending ? 'Enviando…' : `Enviar indicação (${selected.length}/3)`}
        </button>
      </div>
    </div>
  )
}
