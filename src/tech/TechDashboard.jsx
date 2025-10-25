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

  useEffect(() => {
    api('ministries').then(setMinistries);
    api('roles').then(setRoles);
  }, []);

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

  return (
    <div style={{ color: '#f9fafb', padding: 20 }}>
      <nav style={{ marginBottom: 20 }}>
        {['control', 'config', 'ministries', 'roles', 'members'].map((t) => (
          <button
            key={t}
            style={tabButton(t)}
            onClick={() => setTab(t)}
          >
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

          <pre
            style={{
              marginTop: 16,
              background: '#1f2937',
              padding: 12,
              borderRadius: 6,
              overflowX: 'auto',
              maxHeight: 200,
            }}
          >
            sessão: {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      )}

      {tab === 'config' && <ConfigPage />}
      {tab === 'ministries' && <MinistriesPage />}
      {tab === 'roles' && <RolesPage />}
      {tab === 'members' && <MembersPage />}
    </div>
  );
}
