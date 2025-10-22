import React, { useEffect } from 'react'
import useStore from './store'
import Header from './components/Header'
import Waiting from './member/WaitingScreen'
import Indication from './member/IndicationScreen'
import Voting from './member/VotingScreen'
import TechDash from './tech/TechDashboard'

export default function App(){
  const { userType, setUserType, session, pollSession } = useStore()

  useEffect(() => {
    // polling da sessão
    pollSession()
    const t = setInterval(pollSession, Number(import.meta.env.VITE_POLL || 2000))
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    // Suporte a reset/forçar perfil pela URL
    const params = new URLSearchParams(window.location.search)
    const reset = params.get('reset')
    const role = params.get('role') // 'member' ou 'tech'

    if (reset === '1') {
      localStorage.removeItem('userType')
      setUserType('')
      // limpa a querystring da URL
      window.history.replaceState(null, '', window.location.pathname)
    }

    if (role === 'member' || role === 'tech') {
      localStorage.setItem('userType', role)
      setUserType(role)
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [setUserType])

  // Tela de escolha quando não há userType
  if (!userType) {
    return (
      <div className="container role-picker">
        <Header />
        <h2>Escolha seu perfil</h2>
        <div className="row">
          <button onClick={() => setUserType('member')}>Sou Membro</button>
          <button onClick={() => setUserType('tech')}>Sou Técnico</button>
        </div>
      </div>
    )
  }

  // Renderização normal
  return (
    <div className="container">
      <Header />
      {userType === 'member' ? (
        session.stage === 'indication' ? <Indication /> :
        session.stage === 'voting' ? <Voting /> :
        <Waiting />
      ) : (
        <TechDash />
      )}
    </div>
  )
}
