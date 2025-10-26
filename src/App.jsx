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

// ⚠️ Removido: import Results (membro não verá mais resultados)

export default function App() {
  const { userType, session } = useStore()

  // sub-aba do membro foi removida — membro só “Participa” conforme o stage

  // garante que, quando técnico muda o estágio, o membro troca de tela automaticamente
  React.useEffect(() => {
    // não precisamos mais controlar aba, apenas deixei para evitar warnings
  }, [session?.stage])

  return (
    <div className="app">
      <Header />

      {userType === 'member' ? (
        // Membro só participa (nada de Resultados aqui)
        session?.stage === 'indication' ? (
          <Indication />
        ) : session?.stage === 'voting' ? (
          <Voting />
        ) : (
          <Waiting />
        )
      ) : (
        // Técnico sempre vê o painel técnico — Resultados ficam lá
        <TechDashboard />
      )}
    </div>
  )
}
