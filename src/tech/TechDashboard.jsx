// src/tech/TechDashboard.jsx
import React, { useEffect, useState } from 'react';
import useStore from '../store';
import { api } from '../api';
import ConfigPage from './ConfigPage';
import MinistriesPage from './MinistriesPage';
import RolesPage from './RolesPage';
import MembersPage from './MembersPage';
import { useMembersMap } from '../utils/useMembersMap';

export default function TechDashboard(){
  const { session } = useStore();

  const [tab, setTab] = useState('control');

  const [ministries, setMinistries] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedMin, setSelectedMin] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // resultados (do cargo selecionado)
  const [loadingResults, setLoadingResults] = useState(false);
  const [results, setResults] = useState([]); // [{ id, name, count }]
  const [errorResults, setErrorResults] = useState('');
  const { byId: memberNames } = useMembersMap();

  useEffect(() => {
    api('ministries').then(setMinistries);
    api('roles').then(setRoles);
  }, []);

  // —— ESTÁGIOS DA SESSÃO (POST para a Function session) ——
  const startIndication = async () => {
    if (!selectedMin || !selectedRole) return;
    await api('session', {
      method: 'POST',
      body: JSON.stringify({
        stage: 'indication',
        ministry_id: String(selectedMin),
        role_id: String(selectedRole),
      }),
    });
  };

  const startVoting = async () => {
    if (!selectedMin || !selectedRole) return;
    await api('session', {
      method: 'POST',
      body: JSON.stringify({
        stage: 'voting',
        ministry_id: String(selectedMin),
        role_id: String(selectedRole),
      }),
    });
  };

  const goIdle = async () => {
    await api('session', {
      method: 'POST',
      body: JSON.stringify({
        stage: 'none',
        ministry_id: '',
        role_id: '',
      }),
    });
  };

  // —— RESULTADOS (gera ranking do cargo selecionado) ——
  const generateResults = async ()=>{
    try {
      setLoadingResults(true);
      setErrorResults('');
      setResults([]);

      const data = await api(`results?role_id=${selectedRole}`)
        .catch(()=> api(`indication?role_id=${selectedRole}`));
      const list = Array.isArray(data) ? data : (data?.results || data?.ranking || []);

      const normalized = list
        .map(item => {
          const id = item.candidate_id ?? item.id ?? item.nominee_id ?? item.member_id ?? String(item);
          const count = Number(item.votes ?? item.indications ?? item.count ?? 0);
          const name = memberNames.get(String(id)) ?? item.name ?? String(id);
          return { id: String(id), name, count };
        })
        .filter(r => r.count > 0)
        .sort((a,b)=> b.count - a.count);

      setResults(normalized);
    } catch (e) {
      console.error(e);
      setErrorResults('Erro ao gerar resultados.');
    } finally {
      setLoadingResults(false);
    }
  };

  // —— SALVAR SNAPSHOT NO SHEETS (apenas técnico) ——
  const saveResultsSnapshot = async () => {
    try {
      if (!selectedRole) {
        alert('Selecione um cargo.');
        return;
      }
      if (results.length === 0) {
        alert('Gere os resultados primeiro.');
        return;
      }

      const minObj  = ministries.find(m => String(m.id) === String(selectedMin));
      const roleObj = roles.find(r => String(r.id) === String(selectedRole));

      const group = {
        ministryId: String(selectedMin || ''),
        ministryName: minObj?.name || 'Sem ministério',
        roleId: String(selectedRole || ''),
        roleName: roleObj?.name || 'Cargo',
        rows: results, // [{ id, name, count }]
      };

      await api('save_results', {
        method: 'POST',
        body: JSON.stringify({
          requested_by: 'tech',
          groups: [group],
        }),
      });

      alert('Resultados salvos no Google Sheets (aba "results_history").');
    } catch (e) {
      console.error(e);
      alert('Falha ao salvar resultados.');
    }
  };

  return (
    <div>
      <nav className="tabs">
        {['control','config','ministries','roles','members'].map(t=> (
          <button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>
        ))}
      </nav>

      {tab==='control' && (
        <div>
          <h2>Controle da Sessão</h2>

          <div className="row">
            <select value={selectedMin} onChange={e=>setSelectedMin(e.target.value)}>
              <option value="">Selecione o ministério…</option>
              {ministries.map(m=> <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select value={selectedRole} onChange={e=>setSelectedRole(e.target.value)}>
              <option value="">Selecione o cargo…</option>
              {roles
                .filter(r=>!selectedMin || String(r.ministry_id)===String(selectedMin))
                .map(r=> <option key={r.id} value={r.id}>{r.name}</option>)
              }
            </select>
          </div>

          <div className="row">
            <button onClick={startIndication} disabled={!selectedMin||!selectedRole}>Indicação</button>
            <button onClick={startVoting}    disabled={!selectedMin||!selectedRole}>Votação</button>
            <button onClick={goIdle}>Aguardar</button>
          </div>

          {/* Resultados do cargo selecionado */}
          <div className="row">
            <button onClick={generateResults} disabled={!selectedRole || loadingResults}>
              {loadingResults ? 'Gerando…' : 'Gerar resultados'}
            </button>
            <button
              onClick={saveResultsSnapshot}
              disabled={!selectedRole || results.length === 0}
              style={{ marginLeft: 8 }}
            >
              Salvar resultados (Sheets)
            </button>
          </div>

          {errorResults && <p style={{ color: 'red' }}>{errorResults}</p>}

          {results.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3>Mais votados</h3>
              <table style={{ width: '100%', maxWidth: 520, borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Posição</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Membro</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px' }}>Votos</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
                      <td style={{ padding: '6px 8px' }}>{idx + 1}º</td>
                      <td style={{ padding: '6px 8px' }}>{r.name}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="row">
            <a href="/api/report" target="_blank" rel="noreferrer">Baixar Relatório (PDF)</a>
          </div>

          <pre>sessão: {JSON.stringify(session,null,2)}</pre>
        </div>
      )}

      {tab==='config' && <ConfigPage/>}
      {tab==='ministries' && <MinistriesPage/>}
      {tab==='roles' && <RolesPage/>}
      {tab==='members' && <MembersPage/>}
    </div>
  );
}
