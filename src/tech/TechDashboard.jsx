// src/tech/TechDashboard.jsx
import React, { useEffect, useState } from 'react';
import useStore from '../store';
import { api } from '../api';
import ConfigPage from './ConfigPage';
import MinistriesPage from './MinistriesPage';
import RolesPage from './RolesPage';
import MembersPage from './MembersPage';
import TopBar from '../components/TopBar';

export default function TechDashboard() {
  const { setStage } = useStore();
  const [tab, setTab] = useState('control');

  // dados
  const [ministries, setMinistries] = useState([]);
  const [roles, setRoles] = useState([]);

  // seleção atual para iniciar etapas
  const [selectedMin, setSelectedMin] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // status agregado do backend
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [errStatus, setErrStatus] = useState('');

  // carregar listas básicas
  useEffect(() => {
    api('ministries').then(setMinistries).catch(() => setMinistries([]));
    api('roles').then(setRoles).catch(() => setRoles([]));
    loadStatus();
    const interval = setInterval(loadStatus, 5000); // atualiza a cada 5s
    return () => clearInterval(interval);
  }, []);

  async function loadStatus() {
    try {
      setLoadingStatus(true);
      setErrStatus('');
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error('Erro ao carregar status:', e);
      setErrStatus('Falha ao carregar status.');
    } finally {
      setLoadingStatus(false);
    }
  }

  // Grava a fase global no backend e também atualiza a store local para refletir ministério/cargo
  async function postSession(stage) {
    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ministry_id: selectedMin,
          role_id: selectedRole,
          stage, // 'none' | 'indication' | 'voting'
        }),
      });
      // Muda o stage local apenas para manter o contexto (o técnico permanece nesta tela pelo App.jsx)
      setStage(stage, selectedMin, selectedRole);
      await loadStatus();
    } catch (e) {
      alert('Não foi possível atualizar a sessão. Verifique a conexão.');
    }
  }

  const startIndication = () => postSession('indication');
  const startVoting = () => postSession('voting');
  const goIdle = () => postSession('none');

  // estilos
  const baseButton = {
    background: '#22c55e',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '8px 16px',
    fontWeight: 600,
    cursor: 'pointer',
  };
  const secondaryButton = { ...baseButton, background: '#3b82f6' };
  const dangerButton = { ...baseButton, background: '#ef4444' };
  const selectStyle = {
    background: '#1f2937',
    color: '#f9fafb',
    border: '1px solid #374151',
    borderRadius: 6,
    padding: '8px',
    minWidth: 200,
  };
  const tabButton = (t) => ({
    background: tab === t ? '#22c55e' : '#1f2937',
    color: tab === t ? '#fff' : '#9ca3af',
    border: 'none',
    borderRadius: 6,
    padding: '8px 14px',
    marginRight: 6,
    cursor: 'pointer',
    fontWeight: 600,
  });

  const progressPercent =
    status && status.total_members > 0
      ? Math.round((Number(status.participated_count || 0) / Number(status.total_members || 0)) * 100)
      : 0;

  return (
    <div style={{ color: '#f9fafb', minHeight: '100vh', background: '#0f172a' }}>
      <TopBar />

      <div style={{ padding: 20 }}>
        {/* Navegação por abas */}
        <nav style={{ marginBottom: 20 }}>
          {['control', 'config', 'ministries', 'roles', 'members'].map((t) => (
            <button key={t} style={tabButton(t)} onClick={() => setTab(t)}>
              {t === 'control'
                ? 'Controle'
                : t === 'config'
                ? 'Configuração'
                : t === 'ministries'
                ? 'Ministérios'
                : t === 'roles'
                ? 'Cargos'
                : 'Membros'}
            </button>
          ))}
        </nav>

        {/* Aba Controle */}
        {tab === 'control' && (
          <div>
            <h2 style={{ marginBottom: 12 }}>Controle da Sessão</h2>

            {/* Bloco de andamento */}
            <div style={{ background: '#1f2937', padding: 16, borderRadius: 8, marginBottom: 20 }}>
              <h3 style={{ marginTop: 0, color: '#22c55e' }}>📊 Andamento da Sessão</h3>

              {errStatus && (
                <p style={{ color: '#fca5a5', marginBottom: 8 }}>{errStatus}</p>
              )}

              {loadingStatus && !status ? (
                <p style={{ color: '#9ca3af' }}>Carregando status...</p>
              ) : status ? (
                <>
                  <p style={{ marginBottom: 10 }}>
                    <strong>Ministério:</strong> {status.ministry_name || '-'}
                    <br />
                    <strong>Cargo:</strong> {status.role_name || '-'}
                    <br />
                    <strong>Tipo de Sessão:</strong>{' '}
                    {status.voting_active
                      ? 'Votação'
                      : status.indication_active
                      ? 'Indicação'
                      : 'Nenhuma ativa'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
                    <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, padding: 12 }}>
                      <div style={{ color: '#9ca3af', fontSize: 12 }}>Membros logados (ativos agora)</div>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>{status.logged_count ?? 0}</div>
                    </div>
                    <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, padding: 12 }}>
                      <div style={{ color: '#9ca3af', fontSize: 12 }}>Já participaram</div>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>
                        {status.participated_count ?? 0} / {status.total_members ?? 0}
                      </div>
                    </div>
                    <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, padding: 12 }}>
                      <div style={{ color: '#9ca3af', fontSize: 12 }}>Atualizado em</div>
                      <div style={{ fontSize: 14 }}>
                        {status.timestamp ? new Date(status.timestamp).toLocaleTimeString() : '-'}
                      </div>
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div style={{ marginTop: 14 }}>
                    <div
                      style={{
                        background: '#374151',
                        borderRadius: 6,
                        overflow: 'hidden',
                        height: 14,
                      }}
                    >
                      <div
                        style={{
                          width: `${progressPercent}%`,
                          height: '100%',
                          background: '#22c55e',
                          transition: 'width .3s ease',
                        }}
                      />
                    </div>
                    <p style={{ fontSize: 12, marginTop: 6 }}>Progresso: {progressPercent}%</p>
                  </div>
                </>
              ) : (
                <p style={{ color: '#9ca3af' }}>Sem dados de status.</p>
              )}
            </div>

            {/* Bloco de controle */}
            <div style={{ background: '#1f2937', padding: 16, borderRadius: 8 }}>
              <h3 style={{ marginTop: 0, color: '#3b82f6' }}>⚙️ Controle de Votação / Indicação</h3>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <select
                  value={selectedMin}
                  onChange={(e) => setSelectedMin(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Selecione o ministério…</option>
                  {ministries.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Selecione o cargo…</option>
                  {roles
                    .filter((r) => !selectedMin || r.ministry_id === selectedMin)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={startIndication}
                  style={baseButton}
                  disabled={!selectedMin || !selectedRole}
                  title={!selectedMin || !selectedRole ? 'Selecione ministério e cargo' : 'Iniciar Indicação'}
                >
                  Iniciar Indicação
                </button>

                <button
                  onClick={startVoting}
                  style={secondaryButton}
                  disabled={!selectedMin || !selectedRole}
                  title={!selectedMin || !selectedRole ? 'Selecione ministério e cargo' : 'Iniciar Votação'}
                >
                  Iniciar Votação
                </button>

                <button onClick={goIdle} style={dangerButton} title="Encerrar sessão (aguardar)">
                  Encerrar Sessão
                </button>
              </div>

              <div style={{ marginTop: 16 }}>
                <a
                  href="/api/report"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 600 }}
                >
                  📄 Baixar Relatório (PDF)
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Outras abas */}
        {tab === 'config' && <ConfigPage />}
        {tab === 'ministries' && <MinistriesPage />}
        {tab === 'roles' && <RolesPage />}
        {tab === 'members' && <MembersPage />}
      </div>
    </div>
  );
}
