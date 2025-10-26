// src/member/IndicationScreen.jsx
import React, { useMemo, useState } from 'react'
import { api } from '../api'
import useStore from '../store'
import WaitingScreen from './WaitingScreen'
import { useMembersMap } from '../utils/useMembersMap'

export default function IndicationScreen() {
  const { session } = useStore()
  const { list: members } = useMembersMap()

  // estado local
  const [selected, setSelected] = useState([])  // lista de IDs indicados
  const [sending, setSending] = useState(false) // estado de envio
  const [done, setDone] = useState(false)       // indica que já concluiu e deve ir para Aguardar

  // filtro por ministério/cargo da sessão atual
  const available = useMemo(() => {
    // ajuste a regra conforme seu app filtra candidatos; deixei sem filtro estrito por segurança
    return members
  }, [members])

  // alterna seleção de um candidato
  const toggle = (id) => {
    if (sending) return
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length >= 3
          ? prev // limita a 3 indicações
          : [...prev, id]
    )
  }

  const canSend = selected.length > 0 && selected.length <= 3 && !sending

  const sendIndication = async () => {
    if (!canSend) return
    try {
      setSending(true)
      // corpo do envio: ajuste os nomes dos campos se seu backend esperar outro formato
      await api('indication', {
        method: 'POST',
        body: JSON.stringify({
          role_id: session?.role_id,
          ministry_id: session?.ministry_id,
          nominees: selected, // array de IDs
        }),
      })
      alert('Indicação concluída!')
      setDone(true) // só depois do popup, troca para Aguardar
    } catch (e) {
      console.error(e)
      alert('Não foi possível enviar sua indicação. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  // após concluir, envia o usuário para a tela de aguarde
  if (done) return <WaitingScreen />

  return (
    <div style={{ padding: 16 }}>
      <h2>Indicação</h2>
      <p style={{ color: '#9ca3af' }}>
        Selecione até 3 pessoas para indicar.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
        {available.map(m => {
          const isSel = selected.includes(String(m.id))
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(String(m.id))}
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
          onClick={sendIndication}
          disabled={!canSend}
        >
          {sending ? 'Enviando…' : `Enviar indicação${selected.length > 1 ? 's' : ''} (${selected.length}/3)`}
        </button>
      </div>
    </div>
  )
}
