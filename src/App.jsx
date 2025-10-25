// src/App.jsx
import React from 'react'
import useStore from './store'

// telas do membro (pastas e nomes corretos)
import Indication from './member/IndicationScreen'
import Voting from './member/VotingScreen'
import Waiting from './member/WaitingScreen'

// tela técnica
import TechDashboard from './tech/TechDashboard'

// nova página de resultados acessível aos membros
import Results from './pages/Results'

export default function App() {
  const { userType, session } = useStore()

  // sub-aba no perfil "member"
  const [memberTab, setMemberTab] = React.useState('participar')

  return (
    <div className="app">
      {userType === 'member' ? (
        <>
          <nav className="tabs" style={{ marginBottom: 12 }}>
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
