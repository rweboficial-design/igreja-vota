// src/components/Header.jsx
import React from 'react'
import useStore from '../store'

export default function Header() {
  // Pode ser que seu store ainda não exponha setUserType. Tratamos os dois casos:
  let userType = 'member'
  let setUserType = null
  try {
    const s = useStore()
    userType = s?.userType ?? 'member'
    setUserType = s?.setUserType ?? null
  } catch (e) {
    // se o hook do store falhar, mantemos valores padrão
  }

  const label = userType === 'member' ? 'Entrar como Técnico' : 'Entrar como Membro'

  const handleToggle = () => {
    const next = userType === 'member' ? 'tech' : 'member'
    if (typeof setUserType === 'function') {
      // ✅ Caminho ideal: pelo store
      setUserType(next)
    } else {
      // 🆘 Plano B: persiste direto e recarrega
      try { localStorage.setItem('profile', next) } catch {}
      window.location.reload()
    }
  }

  return (
    <header className="header" style={{
      display:'flex', alignItems:'center', gap:12,
      padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,.1)'
    }}>
      <h1 style={{ fontSize:18, margin:0 }}>Igreja Vota</h1>
      <div style={{ marginLeft:'auto' }}>
        <button onClick={handleToggle}>{label}</button>
      </div>
    </header>
  )
}
