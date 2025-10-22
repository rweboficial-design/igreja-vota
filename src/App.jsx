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
    pollSession()
    const t = setInterval(pollSession, Number(import.meta.env.VITE_POLL || 2000))
    return () => clearInterval(t)
  }, [])

  // 🔹 Sempre exibe a escolha se não houver tipo salvo
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
