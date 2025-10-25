// src/tech/TechDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import useStore from '../store';
import { api } from '../api';
import ConfigPage from './ConfigPage';
import MinistriesPage from './MinistriesPage';
import RolesPage from './RolesPage';
import MembersPage from './MembersPage';
import TopBar from '../components/TopBar';

function norm(v) {
  return String(v ?? '').trim();
}

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

  // erros de listas
  const [errLists, setErrLists] = useState('');

  // Carrega ministries e roles
  async function loadLists() {
    setErrLists('');
    try {
      const mins = await api('ministries');
      const normMins = (Array.isArray(mins) ? mins : [])
        .map(m => ({ id: norm(m.id), name: norm(m.name) }))
        .filter(m => m.id && m.name)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      setMinistries(normMins);
    } catch (e) {
      console.error('Falha ao carregar ministries:', e);
      setErrLists('Falha ao carregar lista de ministérios.');
      setMinistries([]);
    }

    try {
      const rls = await api('roles');
      const normRoles = (Array.isArray(rls) ? rls : [])
        .map(r => ({ id: norm(r.id), name: norm(r.name), ministry_id: norm(r.ministry_id) }))
        .filter(r => r.id && r.name)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      setRoles(normRoles);
    } catch (e) {
      console.error('Falha ao carregar roles:', e);
      setErrLists(prev => prev ? prev + ' / Falha ao carregar cargos.' : 'Falha ao carregar cargos.');
      setRoles([]);
    }
  }

  // Carrega status
  async function loadStatus() {
    try {
      setLoadingStatus(true);
      setErrStatus('');
      const res = await fetch('/api/status');
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`status ${res.status}: ${t}`);
      }
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error('Erro ao carregar status:', e);
      setErrStatus('Falha ao carregar status.');
    } finally {
      setLoadingStatus(false);
    }
  }

  // Efeito de inicialização e atualização
  useEffect(() => {
    let cancelled = false;

    (async () => {
      await loadLists();
      if (!cancelled) await loadStatus();
    })();

const interval = setInterval(() => {
  if (!cancelled) loadStatus();
}, 10000); // 10s

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // ao trocar o ministério, limpamos o cargo selecionado
  useEffect(() => {
    setSelectedRole('');
  }, [selectedMin]);

  // grava fase
  async function postSession(stage) {
    try {
      const body = { ministry_id: selectedMin, role_id: selectedRole, stage };
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`status ${res.status}: ${t}`);
      }
      setStage(stage, selectedMin, selectedRole);
      await loadStatus();
    } catch (e) {
      console.error('Erro ao atualizar sessão:', e);
      alert('Não foi possível atualizar a sessão. Verifique a conexão.');
    }
  }

  const startIndication = () => postSession('indication');
  const startVoting = () => postSession('voting');
  const goIdle = () => postSession('none');

  // filtro de cargos pelo ministério
  const filteredRoles = useMemo(() => {
    const minId = norm(selectedMin);
    if (!minId) return [];
    return roles.filter(r => norm(r.ministry_id) === minId);
  }, [roles, selectedMin]);

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
    border: '1px solid #374151', // <- CORRIGIDO
    borderRadius: 6,
    padding: '8px',
    minWidth: 220,
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
      ? Math.round(
          (Number(status.participated_count || 0) /
            Number(status.total_members || 0)) * 100
        )
      : 0;

  return (
    <div style={{ color: '#f9fafb', minHeight: '100vh', background: '#0f172a' }}>
      <TopBar />

      <div style={{ padding: 20 }}>
        {/* Tabs */}
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

        {/* Controle */}
        {tab === 'control' && (
          <div>
            <h2 style={{ marginBottom: 12 }}>Controle da Sessão</h2>

            <div style={{ background: '#1f2937', padding: 16, borderRadius: 8, marginBottom: 20 }}>
              <h3 style={{ marginTop: 0, color: '#22c55e' }}>📊 Andamento da Sessão</h3>

              {errStatus && (
                <p style={{ color: '#fca5a5', marginBottom: 8 }}>{errStatus}</p>
              )}

              {!status ? (
                loadingStatus ? (
                  <p style={{ color: '#9ca3af' }}>Carregando status...</p>
                ) : (
                  <p style={{ color: '#9ca3af' }}>Sem dados de status.</p>
                )
              ) : (
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

                  <div style={{ marginTop: 14 }}>
                    <div style={{ background: '#374151', borderRadius: 6, overflow: 'hidden', height: 14 }}>
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
              )}
            </div>

            <div style={{ background: '#1f2937', padding: 16, borderRadius: 8 }}>
              <h3 style={{ marginTop: 0, color: '#3b82f6' }}>⚙️ Controle de Votação / Indicação</h3>

              {errLists && (
                <div style={{ color: '#fca5a5', marginBottom: 10 }}>
                  {errLists}{' '}
                  <button
                    onClick={loadLists}
                    style={{
                      marginLeft: 8,
                      background: 'transparent',
                      border: '1px solid #fca5a5',
                      color: '#fca5a5',
                      borderRadius: 6,
                      padding: '4px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <select
                  value={selectedMin}
                  onChange={(e) => setSelectedMin(norm(e.target.value))}
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
                  onChange={(e) => setSelectedRole(norm(e.target.value))}
                  style={selectStyle}
                  disabled={!selectedMin}
                >
                  <option value="">
                    {selectedMin ? 'Selecione o cargo…' : 'Escolha um ministério primeiro'}
                  </option>
                  {filteredRoles.map((r) => (
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
