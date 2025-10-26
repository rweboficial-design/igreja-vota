// src/App.jsx
import React from 'react'
import useStore from './store'

// topo com botão de troca de perfil
import Header from './components/Header'

// telas do membro
import Indication from './member/IndicationScreen'
import Voting from './member/VotingScreen'
import Waiting from './member/WaitingScreen'

// técnico
import TechDashboard from './tech/TechDashboard'

// página de resultados (somente visualização para membros)
import Results from './pages/Results'

export default function App() {
  const { userType, session } = useStore()

  // sub-aba do membro
  const [memberTab, setMemberTab] = React.useState('participar')

  // quando técnico mudar o estágio, força a aba "participar"
  React.useEffect(() => {
    if (session?.stage === 'indication' || session?.stage === 'voting') {
      setMemberTab('participar')
    }
  }, [session?.stage])

  return (
    <div className="app">
      <Header />

      {userType === 'member' ? (
        <>
          <nav className="tabs" style={{ margin: '12px 0' }}>
            <button
              className={memberTab === 'participar' ? 'active' : ''}
              onClick={() => setMemberTab('participar')}
            >
              Participar
            </button>
            <button
              className={memberTab === 'resultados' ? 'active' : ''}
              onClick={() => setMemberTab('resultados')}
            >
              Resultados
            </button>
          </nav>

          {memberTab === 'resultados' ? (
            <Results />
          ) : (
            session?.stage === 'indication' ? (
              <Indication />
            ) : session?.stage === 'voting' ? (
              <Voting />
            ) : (
              <Waiting />
            )
          )}
        </>
      ) : (
        <TechDashboard />
      )}
    </div>
  )
}
