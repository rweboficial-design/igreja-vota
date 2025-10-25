import React, { useEffect, useState } from 'react';
import useStore from '../store';
import { api } from '../api';
import ConfigPage from './ConfigPage';
import MinistriesPage from './MinistriesPage';
import RolesPage from './RolesPage';
import MembersPage from './MembersPage';

export default function TechDashboard() {
  const { session, setStage } = useStore();
  const [tab, setTab] = useState('control');
  const [ministries, setMinistries] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedMin, setSelectedMin] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api('ministries').then(setMinistries);
    api('roles').then(setRoles);
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error('Erro ao carregar status:', e);
    }
  };

  const startIndication = () => setStage('indication', selectedMin, selectedRole);
  const startVoting = () => setStage('voting', selectedMin, selectedRole);
  const goIdle = () => setStage('none');

  const baseButton = {
    background: '#22c55e',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '8px 16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background .2s ease',
  };

  const secondaryButton = {
    ...baseButton,
    background: '#3b82f6',
  };

  const dangerButton = {
    ...baseButton,
    background: '#ef4444',
  };

  const selectStyle = {
    background: '#1f2937',
    color: '#f9fafb',
    border: '1px solid #374151',
    borderRadius: 6,
    padding: '8px',
    minWidth: 180,
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
      ? Math.round((status.voted_count / status.total_members) * 100)
      : 0;

  return (
    <div style={{ color: '#f9fafb', padding: 20 }}>
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

      {tab === 'control' && (
        <div>
          <h2 style={{ marginBottom: 12 }}>Controle da Sessão</h2>

          {/* STATUS ATUAL */}
          <div
            style={{
              background: '#1f2937',
              padding: 16,
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            <h3 style={{ marginTop: 0, color: '#22c55e' }}>📊 Andamento da Sessão</h3>
            {status ? (
              <>
                <p>
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

                <div style={{ marginTop: 8 }}>
                  <strong>Membros logados:</strong> {status.total_members || 0}
                  <br />
                  <strong>Participantes que já votaram:</strong>{' '}
                  {status.voted_count || 0}
                </div>

                <div
                  style={{
                    background: '#374151',
                    borderRadius: 6,
                    overflow: 'hidden',
                    height: 14,
                    marginTop: 10,
                  }}
                >
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      height: '100%',
                      background: '#22c55e',
                      transition: 'width .3s ease',
                    }}
                  ></div>
                </div>

                <p style={{ fontSize: 12, marginTop: 6 }}>
                  Progresso: {progressPercent}%
                </p>
              </>
            ) : (
              <p style={{ color: '#9ca3af' }}>Carregando status...</p>
            )}
          </div>

          {/* CONTROLE DE VOTAÇÃO */}
          <div
            style={{
              background: '#1f2937',
              padding: 16,
              borderRadius: 8,
            }}
          >
            <h3 style={{ marginTop: 0, color: '#3b82f6' }}>
              ⚙️ Controle de Votação / Indicação
            </h3>

            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                marginBottom: 16,
              }}
            >
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
              >
                Iniciar Indicação
              </button>
              <button
                onClick={startVoting}
                style={secondaryButton}
                disabled={!selectedMin || !selectedRole}
              >
                Iniciar Votação
              </button>
              <button onClick={goIdle} style={dangerButton}>
                Encerrar Sessão
              </button>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <a
              href="/api/report"
              target="_blank"
              rel="noreferrer"
              style={{
                color: '#3b82f6',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              📄 Baixar Relatório (PDF)
            </a>
          </div>
        </div>
      )}

      {tab === 'config' && <ConfigPage />}
      {tab === 'ministries' && <MinistriesPage />}
      {tab === 'roles' && <RolesPage />}
      {tab === 'members' && <MembersPage />}
    </div>
  );
}
