import React, { useEffect, useState } from 'react';
import useStore from '../store';
import { api } from '../api';
import ConfigPage from './ConfigPage';
import MinistriesPage from './MinistriesPage';
import RolesPage from './RolesPage';
import MembersPage from './MembersPage';
import L from '../ui/labels';

export default function TechDashboard(){
  const { session, setStage } = useStore();
  const [tab, setTab] = useState('control');
  const [ministries, setMinistries] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedMin, setSelectedMin] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Carrega listas base
  useEffect(()=>{
    api('ministries').then(setMinistries);
    api('roles').then(setRoles);
  },[]);

  // Quando mudar o ministério selecionado, se o cargo atual não pertencer a ele, limpa a seleção de cargo
  useEffect(()=>{
    if (!selectedMin) { setSelectedRole(''); return; }
    if (selectedRole) {
      const ok = roles.some(r => r.id === selectedRole && r.ministry_id === selectedMin);
      if (!ok) setSelectedRole('');
    }
  }, [selectedMin, selectedRole, roles]);

  // Sempre que entrar na aba "control", atualiza listas (útil depois que você cria/edita ministérios/cargos nas outras abas)
  useEffect(()=>{
    if (tab === 'control') {
      api('ministries').then(setMinistries);
      api('roles').then(setRoles);
    }
  }, [tab]);

  const startIndication = ()=> setStage('indication', selectedMin, selectedRole);
  const startVoting    = ()=> setStage('voting',    selectedMin, selectedRole);
  const goIdle         = ()=> setStage('none');

  const tabs = [
    { key:'control',    label:L.tab_control },
    { key:'config',     label:L.tab_config },
    { key:'ministries', label:L.tab_ministries },
    { key:'roles',      label:L.tab_roles },
    { key:'members',    label:L.tab_members },
  ];

  return (
    <div>
      <nav className="tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={tab===t.key ? 'active' : ''}
            onClick={()=>setTab(t.key)}
            title={t.label}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab==='control' && (
        <div>
          <h2>{L.control_title}</h2>

          <div className="row">
            <select
              value={selectedMin}
              onChange={e=>setSelectedMin(e.target.value)}
              aria-label="Ministério"
            >
              <option value="">{L.select_ministry}</option>
              {ministries.map(m=> (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <select
              value={selectedRole}
              onChange={e=>setSelectedRole(e.target.value)}
              aria-label="Cargo"
            >
              <option value="">{L.select_role}</option>
              {roles
                .filter(r => !selectedMin || r.ministry_id === selectedMin)
                .map(r => <option key={r.id} value={r.id}>{r.name}</option>)
              }
            </select>
          </div>

          <div className="row">
            <button
              onClick={startIndication}
              disabled={!selectedMin || !selectedRole}
              title={!selectedMin || !selectedRole ? L.warn_pick_min_role : undefined}
            >
              {L.btn_indication}
            </button>

            <button
              onClick={startVoting}
              disabled={!selectedMin || !selectedRole}
              title={!selectedMin || !selectedRole ? L.warn_pick_min_role : undefined}
            >
              {L.btn_voting}
            </button>

            <button onClick={goIdle}>
              {L.btn_waiting}
            </button>
          </div>

          <div className="row">
            <a href="/api/report" target="_blank" rel="noreferrer">
              {L.link_pdf}
            </a>
          </div>

          <pre>sessão: {JSON.stringify(session,null,2)}</pre>
        </div>
      )}

      {tab==='config'      && <ConfigPage/>}
      {tab==='ministries'  && <MinistriesPage/>}
      {tab==='roles'       && <RolesPage/>}
      {tab==='members'     && <MembersPage/>}
    </div>
  );
}
