import React, { useEffect } from 'react'
import useStore from './store'
import Header from './components/Header'
import Waiting from './member/WaitingScreen'
import Indication from './member/IndicationScreen'
import Voting from './member/VotingScreen'
import TechDash from './tech/TechDashboard'

export default function App(){
  const { userType, setUserType, session, pollSession } = useStore()

  useEffect(()=>{ pollSession(); const t=setInterval(pollSession, Number(import.meta.env.VITE_POLL||2000)); return ()=>clearInterval(t) },[])

  return (
    <div className="container">
      <Header />
      {!userType && (
        <div className="role-picker">
          <h2>Escolha seu perfil</h2>
          <button onClick={()=>setUserType('member')}>Membro</button>
          <button onClick={()=>setUserType('tech')}>Técnico</button>
        </div>
      )}
      {userType==='member' && (
        session.stage==='indication' ? <Indication/> : session.stage==='voting' ? <Voting/> : <Waiting/>
      )}
      {userType==='tech' && <TechDash/>}
    </div>
  )
}