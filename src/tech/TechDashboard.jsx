import React, { useEffect, useState } from 'react';
import useStore from '../store';
import { api } from '../api';
import ConfigPage from './ConfigPage';
import MinistriesPage from './MinistriesPage';
import RolesPage from './RolesPage';
import MembersPage from './MembersPage';

export default function TechDashboard(){
  const { session, setStage } = useStore()
  const [tab, setTab] = useState('control')
  const [ministries, setMinistries] = useState([])
  const [roles, setRoles] = useState([])
  const [selectedMin, setSelectedMin] = useState('')
  const [selectedRole, setSelectedRole] = useState('')

  useEffect(()=>{ api('ministries').then(setMinistries); api('roles').then(setRoles) },[])

  const startIndication = ()=> setStage('indication', selectedMin, selectedRole)
  const startVoting = ()=> setStage('voting', selectedMin, selectedRole)
  const goIdle = ()=> setStage('none')

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
              {roles.filter(r=>!selectedMin || r.ministry_id===selectedMin).map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="row">
            <button onClick={startIndication} disabled={!selectedMin||!selectedRole}>Indicação</button>
            <button onClick={startVoting} disabled={!selectedMin||!selectedRole}>Votação</button>
            <button onClick={goIdle}>Aguardar</button>
          </div>
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
  )
}
