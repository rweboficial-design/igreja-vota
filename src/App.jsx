// src/App.jsx
import React from 'react'
import useStore from './store'

// ⚠️ Ajuste estes imports conforme os nomes/caminhos no seu projeto:
import TechDashboard from './tech/TechDashboard'
import Indication from './pages/Indication'     // se o seu for "Indicar.jsx", ajuste aqui
import Voting from './pages/Voting'             // se for "VotingScreen.jsx", ajuste para './pages/VotingScreen'
import Waiting from './pages/Waiting'           // se a tela de espera tiver outro nome/caminho, ajuste
import Results from './pages/Results'           // nova página criada anteriormente

export default function App() {
  const { userType, session } = useStore()

  // Nova sub-aba para o perfil "member"
  // "participar" = telas normais (Indicação / Votação / Aguardar)
  // "resultados" = nova aba de ranking acessível a todos os membros
  const [memberTab, setMemberTab] = React.useState('participar')

  return (
    <div className="app">
      {/* Quando for MEMBRO */}
      {userType === 'member' ? (
        <>
          {/* Navegação de sub-abas do membro */}
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

          {/* Conteúdo de acordo com a sub-aba */}
          {memberTab === 'resultados' ? (
            <Results />
          ) : (
            // Fluxo original guiado pelo estágio da sessão
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
        // Quando for TÉCNICO/ADMIN (mantém seu dashboard técnico)
        <TechDashboard />
      )}
    </div>
  )
}
