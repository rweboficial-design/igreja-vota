import React, { useEffect, useState, useMemo } from 'react';
import useStore from '../store';
import { api } from '../api';
import ConfigPage from './ConfigPage';
import MinistriesPage from './MinistriesPage';
import RolesPage from './RolesPage';
import MembersPage from './MembersPage';
import { useMembersMap } from '../utils/useMembersMap';

export default function TechDashboard(){
  const { session, setStage } = useStore()
  const [tab, setTab] = useState('control')
  const [ministries, setMinistries] = useState([])
  const [roles, setRoles] = useState([])
  const [selectedMin, setSelectedMin] = useState('')
  const [selectedRole, setSelectedRole] = useState('')

  // estados do botão de resultados
  const [loadingResults, setLoadingResults] = useState(false)
  const [results, setResults] = useState([])
  const [errorResults, setErrorResults] = useState('')
  const { byId: memberNames } = useMembersMap()

  useEffect(()=>{ api('ministries').then(setMinistries); api('roles').then(setRoles) },[])

  const startIndication = ()=> setStage('indication', selectedMin, selectedRole)
  const startVoting = ()=> setStage('voting', selectedMin, selectedRole)
  const goIdle = ()=> setStage('none')

  // Função para gerar resultados
  const generateResults = async ()=>{
    try {
      setLoadingResults(true)
      setErrorResults('')
      setResults([])

      // Busca votos ou indicações agregadas (ajuste se precisar)
      const data = await api(`results?role_id=${selectedRole}`).catch(()=>api(`indication?role_id=${selectedRole}`))
      const list = Array.isArray(data) ? data : data?.results || data?.ranking || []

      // normaliza e ordena
      const normalized = list.map(item => {
        const id = item.candidate_id ?? item.id ?? item.nominee_id ?? item.member_id ?? String(item)
        const count = item.votes ?? item.indications ?? item.count ?? 0
        const name = memberNames.get(String(id)) ?? item.name ?? String(id)
        return { id, name, count }
      }).sort((a,b)=>b.count - a.count)

      setResults(normalized)
    } catch(e) {
      console.error(e)
      setErrorResults('Erro ao gerar resultados.')
    } finally {
      setLoadingResults(false)
    }
  }

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
                .filter(r=>!selectedMin || r.ministry_id===selectedMin)
                .map(r=> <option key={r.id} value={r.id}>{r.name}</option>)
              }
            </select>
          </div>

          <div className="row">
            <button onClick={startIndication} disabled={!selectedMin||!selectedRole}>Indicação</button>
            <button onClick={startVoting} disabled={!selectedMin||!selectedRole}>Votação</button>
            <button onClick={goIdle}>Aguardar</button>
          </div>

          {/* 🔘 Novo botão para gerar resultados */}
          <div className="row">
            <button onClick={generateResults} disabled={!selectedRole || loadingResults}>
              {loadingResults ? 'Gerando…' : 'Gerar resultados'}
            </button>
          </div>

          {/* Exibição dos resultados */}
          {errorResults && <p style={{ color: 'red' }}>{errorResults}</p>}

          {results.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3>Mais votados</h3>
              <table style={{ width: '100%', maxWidth: 520, borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
