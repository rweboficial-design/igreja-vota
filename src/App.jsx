// src/App.jsx
import React from 'react';
import useStore from './store';

// telas do membro
import Indication from './member/IndicationScreen';
import Voting from './member/VotingScreen';
import Waiting from './member/WaitingScreen';

// técnico
import TechDashboard from './tech/TechDashboard';

// página de resultados (somente visualização para membros)
import Results from './pages/Results';

export default function App() {
  const { userType, session } = useStore();

  // sub-aba do membro: "participar" (fluxo guiado por stage) | "resultados" (só visualizar)
  const [memberTab, setMemberTab] = React.useState('participar');

  // 👉 sempre que entrar em indication/voting, força a aba "participar"
  React.useEffect(() => {
    if (session?.stage === 'indication' || session?.stage === 'voting') {
      setMemberTab('participar');
    }
  }, [session?.stage]);

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
  );
}
